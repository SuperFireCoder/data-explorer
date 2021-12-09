import {
    FixedContainer,
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";
import {
    ChangeEventHandler,
    FormEvent,
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { SearchResponse } from "elasticsearch";
import { useRouter } from "next/router";
import bodybuilder, { Bodybuilder } from "bodybuilder";
import axios from "axios";
import {
    InputGroup,
    Button,
    H6,
    Switch,
    Overlay,
    Spinner,
    Icon,
} from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import Header from "../components/Header";
import DatasetCard from "../components/DatasetCard";
import Pagination from "../components/Pagination";
import FacetMultiSelectFacetState from "../components/FacetMultiSelectFacetState";
import { EsDataset } from "../interfaces/EsDataset";
import { DatasetType } from "../interfaces/DatasetType";
import { useFacetState } from "../hooks/FacetState";
import {
    getDataExplorerBackendServerUrl,
    getDataExplorerSubbarImportData,
} from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import { Select } from "@blueprintjs/select";
import {
    EsFacetRootConfig,
    MinimumFormState,
    QueryState,
    useEsFacetRoot,
    useEsIndividualFacetArray,
    useEsIndividualFacetFreeText,
} from "../hooks/EsFacet";
import FacetMultiSelectFacetState2 from "../components/FacetMultiSelectFacetState2";
import FacetFreeTextFacetState2 from "../components/FacetFreeTextFacetState2";

const subBarLinks = [
    { key: "explore", href: "/", label: "Explore data" },
    {
        key: "import",
        href: getDataExplorerSubbarImportData() || "#",
        label: "Import data",
    },
];

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;

    /** Array of users/subjects to filter results by */
    filterPrincipals?: string | string[];

    facetYearMin?: string;
    facetYearMax?: string;
    facetTimeDomain?: string | string[];
    facetSpatialDomain?: string | string[];
    facetResolution?: string | string[];
    facetGcm?: string | string[];
    facetDomain?: string | string[];
    facetCollection?: string | string[];
    facetScientificType?: string | string[];
}

interface FormState {
    pageSize: number;
    pageStart: number;
    searchQuery: string;
    filterPrincipals: readonly string[];
    facetYearMin: number;
    facetYearMax: number;
    facetTimeDomain: readonly string[];
    facetSpatialDomain: readonly string[];
    facetResolution: readonly string[];
    facetScientificType: readonly string[];
    facetDomain: readonly string[];
    facetCollection: readonly string[];
    facetGcm: readonly string[];
}

function stripEmptyStringQueryParams(
    queryParams: ParsedUrlQueryInput
): ParsedUrlQueryInput {
    // Create a new object from page params such that empty string values are
    // dropped
    return Object.fromEntries(
        Object.entries(queryParams).filter(
            ([_k, v]) => typeof v !== "string" || v.length !== 0
        )
    );
}

function normaliseAsReadonlyStringArray(
    value: string | readonly string[]
): readonly string[] {
    return typeof value === "string" ? [value] : value;
}

/**
 * Adds term aggregation based facets to given bodybuilder query instance, and
 * a carrying boolean flag that indicates whether the query is "empty" (that is,
 * whether the query has had filters applied such as prior facets or some string
 * query.)
 *
 * @param queryState
 * @param facetEsTerm String identifier for the term used in Elasticsearch query
 * @param facetValues
 *
 * @returns Array of [new bodyBuilder query instance, `isEmptyQuery` boolean]
 */
function addTermAggregationFacetStateToQuery(
    queryState: QueryState,
    facetEsTerm: string,
    facetValues: readonly string[]
): QueryState {
    // If nothing selected for this facet, return state untouched
    if (facetValues.length === 0) {
        return queryState;
    }

    // Add all selected facet values
    let innerQuery = bodybuilder();

    facetValues.forEach(
        (x) => (innerQuery = innerQuery.orQuery("match", facetEsTerm, x))
    );

    const newQueryBuilder = queryState.bodyBuilder.query(
        "bool",
        (innerQuery.build() as any).query.bool
    );

    return {
        bodyBuilder: newQueryBuilder,
        modified: true,
    };
}

function suppressEvent(e: Event | FormEvent | MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
}

const FACETS: EsFacetRootConfig<FormState>["facets"] = [
    {
        id: "searchQuery",
        facetApplicationFn: (formState, query) => {
            const searchQuery = formState.searchQuery.trim();

            // If blank, don't apply this facet
            if (searchQuery.length === 0) {
                return query;
            }

            // The search box value is used for a query against title
            // and description
            const innerQuery = bodybuilder()
                .orQuery("match", "title", searchQuery)
                .orQuery("match", "description", searchQuery);

            return {
                modified: true,
                bodyBuilder: query.bodyBuilder.query(
                    "bool",
                    (innerQuery.build() as any).query.bool
                ),
            };
        },
    },
    {
        id: "facetCollection",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "collection_names",
                formState.facetCollection
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "collection_names",
                    { size: 1000000 },
                    "facetCollection"
                ),
            };
        },
    },
    {
        id: "facetTimeDomain",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "time_domain",
                formState.facetTimeDomain
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "time_domain",
                    { size: 1000000 },
                    "facetTimeDomain"
                ),
            };
        },
    },
    {
        id: "facetSpatialDomain",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "spatial_domain",
                formState.facetSpatialDomain
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "spatial_domain",
                    { size: 1000000 },
                    "facetSpatialDomain"
                ),
            };
        },
    },
    {
        id: "facetResolution",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "resolution",
                formState.facetResolution
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "resolution",
                    { size: 1000000 },
                    "facetResolution"
                ),
            };
        },
    },
    {
        id: "facetScientificType",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "scientific_type",
                formState.facetScientificType
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "scientific_type",
                    { size: 1000000 },
                    "facetScientificType"
                ),
            };
        },
    },
    {
        id: "facetDomain",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "domain",
                formState.facetDomain
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "domain",
                    { size: 1000000 },
                    "facetDomain"
                ),
            };
        },
    },
    {
        id: "facetGcm",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "gcm",
                formState.facetGcm
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "gcm",
                    { size: 1000000 },
                    "facetGcm"
                ),
            };
        },
    },
];

export default function IndexPage() {
    const router = useRouter();

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const formState = useMemo<FormState>(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
            filterPrincipals = [],
            facetYearMin = "",
            facetYearMax = "",
            facetTimeDomain = [],
            facetSpatialDomain = [],
            facetResolution = [],
            facetScientificType = [],
            facetDomain = [],
            facetCollection = [],
            facetGcm = [],
        } = router.query as QueryParameters;

        return {
            // Pagination
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,

            // String search query
            searchQuery,

            // Principals
            filterPrincipals: normaliseAsReadonlyStringArray(filterPrincipals),

            // Facets
            facetYearMin: parseInt(facetYearMin, 10), // Value may be NaN
            facetYearMax: parseInt(facetYearMax, 10), // Value may be NaN
            facetTimeDomain: normaliseAsReadonlyStringArray(facetTimeDomain),
            facetSpatialDomain:
                normaliseAsReadonlyStringArray(facetSpatialDomain),
            facetResolution: normaliseAsReadonlyStringArray(facetResolution),
            facetScientificType:
                normaliseAsReadonlyStringArray(facetScientificType),
            facetDomain: normaliseAsReadonlyStringArray(facetDomain),
            facetCollection: normaliseAsReadonlyStringArray(facetCollection),
            facetGcm: normaliseAsReadonlyStringArray(facetGcm),
        };
    }, [router.query]);

    const updateFormState = useCallback(
        (formState: Partial<FormState>) => {
            // Update query params for this page, which will update `formState`
            // above
            router.push({
                query: stripEmptyStringQueryParams({
                    ...router.query,
                    ...formState,
                }),
            });
        },
        [router.query]
    );

    const esFacetRoot = useEsFacetRoot(formState, updateFormState, {
        facets: FACETS,
        url: `${getDataExplorerBackendServerUrl()}/api/es/search/dataset`,
    });

    const { totalNumberOfResults, queryInProgress, queryResult } = esFacetRoot;

    const searchQuery = useEsIndividualFacetFreeText(esFacetRoot, {
        id: "searchQuery",
        label: "Search",
        placeholder: "Search datasets...",
    });

    const facetCollection = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetCollection",
        label: "Collection",
        placeholder: "Filter by collection...",
    });

    const facetTimeDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetTimeDomain",
        label: "Time domain",
        placeholder: "Filter by time domain...",
    });

    const facetSpatialDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetSpatialDomain",
        label: "Spatial domain",
        placeholder: "Filter by spatial domain...",
    });

    const facetResolution = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetResolution",
        label: "Resolution",
        placeholder: "Filter by resolution...",
    });

    const facetScientificType = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetScientificType",
        label: "Scientific type",
        placeholder: "Filter by scientific type...",
    });

    const facetDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetDomain",
        label: "Domain",
        placeholder: "Filter by domain...",
    });

    const facetGcm = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetGcm",
        label: "GCM",
        placeholder: "Filter by GCM...",
    });

    // // Users/principals to narrow datasets by
    // const [filterPrincipals, setFilterPrincipals] = useState<string[]>([]);

    // Facets
    // // TODO: Implement some way of feeding the default state into the facets
    // // from values contained in `pageParameters` so that they update the UI on
    // // first load
    // const [yearMin, setYearMin] = useState<string>("");
    // const [yearMax, setYearMax] = useState<string>("");

    const currentPageIndex = useMemo(
        () => Math.floor(formState.pageStart / formState.pageSize),
        [formState.pageStart, formState.pageSize]
    );

    const maxPages = useMemo(
        () => Math.ceil(totalNumberOfResults / formState.pageSize),
        [totalNumberOfResults, formState.pageSize]
    );

    // const yearsQueryIsAllYears = useMemo(
    //     () => yearMin === "" && yearMax === "",
    //     [yearMin, yearMax]
    // );

    // const yearsQueryMinBound = useMemo(
    //     () => results?.aggregations?.facetYearMin?.value || 0,
    //     [results]
    // );

    // const yearsQueryMaxBound = useMemo(
    //     () => results?.aggregations?.facetYearMax?.value || 0,
    //     [results]
    // );

    /**
     * Handler to change page query parameter values via URL query parameters.
     */
    const onPageSelect = useCallback(
        (pageIndex: number) => {
            updateFormState({
                pageSize: formState.pageSize,
                pageStart: pageIndex * formState.pageSize,
            });
        },
        [updateFormState, formState.pageSize]
    );

    // const handleYearAllYearsSwitchChange = useCallback<
    //     FormEventHandler<HTMLInputElement>
    // >(() => {
    //     // Switching all years -> valued years: set min and max bounds
    //     if (yearsQueryIsAllYears) {
    //         setYearMin(yearsQueryMinBound);
    //         setYearMax(yearsQueryMaxBound);
    //         return;
    //     }

    //     // Switching valued years -> all years, set min and max blank
    //     setYearMin("");
    //     setYearMax("");
    // }, [yearsQueryIsAllYears, yearsQueryMinBound, yearsQueryMaxBound]);

    // const handleYearMinInputChange = useCallback<
    //     FormEventHandler<HTMLInputElement>
    // >((e) => {
    //     setYearMin(e.currentTarget.value.trim());
    // }, []);

    // const handleYearMaxInputChange = useCallback<
    //     FormEventHandler<HTMLInputElement>
    // >((e) => {
    //     setYearMax(e.currentTarget.value.trim());
    // }, []);

    // const handlePrivacySelectChange = useCallback<
    //     ChangeEventHandler<HTMLSelectElement>
    // >(
    //     (e) => {
    //         const value = e.currentTarget.value;

    //         // If we have the current user's subject ID and they've chosen to
    //         // filter by private then set the filtered principals to subject ID
    //         if (value === "private" && keycloak?.subject !== undefined) {
    //             setFilterPrincipals([keycloak.subject]);
    //             return;
    //         }

    //         // Otherwise set blank
    //         setFilterPrincipals([]);
    //     },
    //     [keycloakToken, keycloak]
    // );

    /**
     * An effect to automatically execute new Elasticsearch query upon page
     * parameter change, such as page increment or page size change.
     */
    // useEffect(
    //     function executeEsQuery() {
    //         const {
    //             pageSize,
    //             pageStart,
    //             searchQuery,
    //             filterPrincipals,
    //             facetYearMin,
    //             facetYearMax,
    //             facetTimeDomain,
    //             facetSpatialDomain,
    //             facetResolution,
    //             facetScientificType,
    //             facetDomain,
    //             facetCollection,
    //             facetGcm,
    //         } = pageParameters;

    //         // Start building Elasticsearch query
    //         let queryBuilder = bodybuilder()
    //             .size(pageSize)
    //             .from(pageStart)
    //             // Facets are built up using aggregations
    //             //
    //             // For `year`, get the min and max values for the UI to
    //             // construct a range slide
    //             .aggregation("min", "year", "facetYearMin")
    //             .aggregation("max", "year", "facetYearMax")
    //             // All other aggregations are buckets of simple string values
    //             .aggregation(
    //                 "terms",
    //                 "time_domain",
    //                 { size: 1000000 },
    //                 "facetTimeDomain"
    //             )
    //             .aggregation(
    //                 "terms",
    //                 "spatial_domain",
    //                 { size: 1000000 },
    //                 "facetSpatialDomain"
    //             )
    //             .aggregation(
    //                 "terms",
    //                 "resolution",
    //                 { size: 1000000 },
    //                 "facetResolution"
    //             )
    //             .aggregation(
    //                 "terms",
    //                 "scientific_type",
    //                 { size: 1000000 },
    //                 "facetScientificType"
    //             )
    //             .aggregation(
    //                 "terms",
    //                 "domain",
    //                 { size: 1000000 },
    //                 "facetDomain"
    //             )
    //             .aggregation(
    //                 "terms",
    //                 "collection_names",
    //                 { size: 1000000 },
    //                 "facetCollection"
    //             )
    //             .aggregation("terms", "gcm", { size: 1000000 }, "facetGcm");

    //         let isEmptyQuery = true;

    //         // Add facets
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "time_domain",
    //             facetTimeDomain
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "spatial_domain",
    //             facetSpatialDomain
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "resolution",
    //             facetResolution
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "scientific_type",
    //             facetScientificType
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "domain",
    //             facetDomain
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "collection_names",
    //             facetCollection
    //         );
    //         [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
    //             queryBuilder,
    //             isEmptyQuery,
    //             "gcm",
    //             facetGcm
    //         );

    //         // Year range
    //         if (!Number.isNaN(facetYearMin) || !Number.isNaN(facetYearMax)) {
    //             isEmptyQuery = false;

    //             const yearRangeQuery: Record<string, number> = {};

    //             if (!Number.isNaN(facetYearMin)) {
    //                 yearRangeQuery["gte"] = facetYearMin;
    //             }

    //             if (!Number.isNaN(facetYearMax)) {
    //                 yearRangeQuery["lte"] = facetYearMax;
    //             }

    //             queryBuilder = queryBuilder.query(
    //                 "range",
    //                 "year",
    //                 yearRangeQuery
    //             );
    //         }

    //         // String search query
    //         if (searchQuery.length !== 0) {
    //             isEmptyQuery = false;

    //             // The search box value is used for a query against title
    //             // and description
    //             const innerQuery = bodybuilder()
    //                 .orQuery("match", "title", searchQuery)
    //                 .orQuery("match", "description", searchQuery);

    //             queryBuilder = queryBuilder.query(
    //                 "bool",
    //                 (innerQuery.build() as any).query.bool
    //             );
    //         }

    //         // If users/principals are provided, apply them as a filter
    //         if (filterPrincipals.length > 0) {
    //             // NOTE: This is a filter, so the `isEmptyQuery` flag does not
    //             // need to be set to `false`
    //             queryBuilder = queryBuilder.filter(
    //                 "terms",
    //                 "allowed_principals",
    //                 filterPrincipals
    //             );
    //         }

    //         // If query empty, attempt to fetch all
    //         if (isEmptyQuery) {
    //             queryBuilder = queryBuilder.query("match_all");
    //         }

    //         const query = queryBuilder.build();

    //         // `Authorization` header depends on whether token is available
    //         const headers: Record<string, string> = {};

    //         if (keycloakToken && keycloakToken.length > 0) {
    //             headers["Authorization"] = `Bearer ${keycloakToken}`;
    //         }

    //         const esQueryCancelToken = axios.CancelToken.source();

    //         axios
    //             .post<SearchResponse<EsDataset>>(
    //                 `${getDataExplorerBackendServerUrl()}/api/es/search/dataset`,
    //                 query,
    //                 { headers, cancelToken: esQueryCancelToken.token }
    //             )
    //             .then((res) => {
    //                 setResults(res.data);
    //             })
    //             .catch((e) => {
    //                 // Ignore cancellation events
    //                 if (axios.isCancel(e)) {
    //                     return;
    //                 }

    //                 console.error(e);

    //                 alert(e.toString());
    //             });

    //         return function stopOngoingEsQuery() {
    //             // Cancel the ES query if it is still running
    //             esQueryCancelToken.cancel();
    //         };
    //     },
    //     [pageParameters, keycloakToken]
    // );

    return (
        <>
            <HtmlHead title={["Datasets", "Explore data"]} />
            <Header
                activeTab="datasets"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
            <FixedContainer>
                <Row>
                    <Col xs={2}>
                        <Row disableDefaultMargins>
                            <Col>
                                <FacetFreeTextFacetState2
                                    facet={searchQuery}
                                    data-testid="search-field"
                                    type="search"
                                    leftIcon="search"
                                    rightElement={
                                        searchQuery.value.length > 0 ? (
                                            <Button
                                                icon="small-cross"
                                                minimal
                                                onClick={() =>
                                                    searchQuery.onValueChange(
                                                        ""
                                                    )
                                                }
                                                style={{
                                                    borderRadius: "100%",
                                                }}
                                            />
                                        ) : undefined
                                    }
                                    id="dataset-search"
                                />
                            </Col>
                        </Row>
                        <form
                            onSubmit={suppressEvent}
                            data-testid="facet-fields"
                        >
                            {/* <Row>
                                <Col>
                                    <Row disableDefaultMargins>
                                        <Col xs={6}>
                                            <H6>Year</H6>
                                        </Col>
                                        <Col
                                            xs={6}
                                            style={{ textAlign: "right" }}
                                        >
                                            <Switch
                                                checked={yearsQueryIsAllYears}
                                                onChange={
                                                    handleYearAllYearsSwitchChange
                                                }
                                                innerLabel="Range"
                                                innerLabelChecked="All"
                                                style={{ marginRight: "-10px" }}
                                            />
                                        </Col>
                                    </Row>
                                    {!yearsQueryIsAllYears && (
                                        <Row
                                            disableDefaultMargins
                                            gutterWidth={2}
                                        >
                                            <Col xs={6}>
                                                <InputGroup
                                                    type="number"
                                                    value={yearMin}
                                                    onChange={
                                                        handleYearMinInputChange
                                                    }
                                                />
                                            </Col>
                                            <Col xs={6}>
                                                <InputGroup
                                                    type="number"
                                                    value={yearMax}
                                                    onChange={
                                                        handleYearMaxInputChange
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    )}
                                </Col>
                            </Row> */}
                            {[
                                facetCollection,
                                facetTimeDomain,
                                facetSpatialDomain,
                                facetResolution,
                                facetScientificType,
                                facetDomain,
                                facetGcm,
                            ].map((facet) => (
                                <Row key={facet.id}>
                                    <Col>
                                        <H6>{facet.label}</H6>
                                        <FacetMultiSelectFacetState2
                                            facet={facet}
                                            // When there is a free text search
                                            // query, disable showing document
                                            // counts as they are misleading
                                            disableDocCountLabel={
                                                searchQuery.value.length !== 0
                                            }
                                        />
                                    </Col>
                                </Row>
                            ))}
                            {/* <Row>
                                <Col>
                                    <H6>Privacy</H6>
                                    <select
                                        value={
                                            filterPrincipals.length === 1 &&
                                            keycloak?.subject ===
                                                filterPrincipals[0]
                                                ? "private"
                                                : "all"
                                        }
                                        onChange={handlePrivacySelectChange}
                                    >
                                        <option value="all">All</option>
                                        <option
                                            value="private"
                                            disabled={
                                                keycloak?.subject === undefined
                                            }
                                        >
                                            Private
                                        </option>
                                    </select>
                                </Col>
                            </Row> */}
                        </form>
                    </Col>
                    <Col xs={10}>
                        <Row disableDefaultMargins align="center">
                            <Col
                                xs="content"
                                className="bp3-ui-text bp3-text-disabled"
                                data-testid="results-count"
                            >
                                {queryInProgress ? (
                                    <Spinner size={Spinner.SIZE_SMALL} />
                                ) : (
                                    <>
                                        {totalNumberOfResults} result
                                        {totalNumberOfResults !== 1 && "s"}
                                    </>
                                )}
                            </Col>
                            <Col
                                style={{ textAlign: "right" }}
                                data-testid="pagination-buttons"
                            >
                                <Pagination
                                    currentIndex={currentPageIndex}
                                    max={maxPages}
                                    onSelect={onPageSelect}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {queryResult?.hits.hits.map(
                                    ({ _id, _source }) => (
                                        <DatasetCard
                                            data-testid="dataset-card"
                                            key={_id}
                                            datasetId={_source.uuid}
                                            title={_source.title}
                                            description={_source.description}
                                            status={_source.status}
                                            failureMessage={
                                                _source.status === "FAILED"
                                                    ? _source.message
                                                    : undefined
                                            }
                                            type={
                                                _source.status === "SUCCESS"
                                                    ? // TODO: Clarify values for "scientific_type"
                                                      ({
                                                          type: _source
                                                              .scientific_type[0],
                                                          subtype:
                                                              _source
                                                                  .scientific_type[1],
                                                      } as unknown as DatasetType)
                                                    : undefined
                                            }
                                            // TODO: Add modification date into ES index
                                            // lastUpdated={lastUpdated}
                                            ownerId={
                                                _source.allowed_principals as string[]
                                            }
                                        />
                                    )
                                )}
                            </Col>
                        </Row>
                        <Row>
                            <Col style={{ textAlign: "right" }}>
                                <Pagination
                                    currentIndex={currentPageIndex}
                                    max={maxPages}
                                    onSelect={onPageSelect}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </FixedContainer>
        </>
    );
}

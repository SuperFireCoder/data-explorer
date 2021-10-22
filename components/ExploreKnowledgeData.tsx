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
    useState,
} from "react";
import { SearchResponse } from "elasticsearch";
import { useRouter } from "next/router";
import bodybuilder, { Bodybuilder } from "bodybuilder";
import axios from "axios";
import { InputGroup, Button, H6, Switch, FocusStyleManager } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import Header from "./Header";
import DatasetCard from "./DatasetCard";
import Pagination from "./Pagination";
import FacetMultiSelectFacetState from "./FacetMultiSelectFacetState";
import { EsDataset } from "../interfaces/EsDataset";
import { DatasetType } from "../interfaces/DatasetType";
import { useFacetState } from "../hooks/FacetState";
import {
    getDataExplorerBackendServerUrl,
    getDataExplorerSubbarImportData,
} from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import { Select } from "@blueprintjs/select";

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
    facetScientificType?: string | string[];
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
 * @param queryBuilder
 * @param isEmptyQuery
 * @param facetEsTerm String identifier for the term used in Elasticsearch query
 * @param facetValues
 *
 * @returns Array of [new bodyBuilder query instance, `isEmptyQuery` boolean]
 */
function addTermAggregationFacetStateToQuery(
    queryBuilder: Bodybuilder,
    isEmptyQuery: boolean,
    facetEsTerm: string,
    facetValues: readonly string[]
): [Bodybuilder, boolean] {
    // If nothing selected for this facet, return state untouched
    if (facetValues.length === 0) {
        return [queryBuilder, isEmptyQuery];
    }

    // Add all selected facet values
    let innerQuery = bodybuilder();

    facetValues.forEach(
        (x) => (innerQuery = innerQuery.orQuery("match", facetEsTerm, x))
    );

    const newQueryBuilder = queryBuilder.query(
        "bool",
        (innerQuery.build() as any).query.bool
    );

    return [newQueryBuilder, false];
}

function suppressEvent(e: Event | FormEvent | MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
}

export default function ExploreKnowledgeData() {
    
    const { keycloak } = useKeycloakInfo();
    const router = useRouter();

    const keycloakToken = keycloak?.token;

    /** Elasticsearch search response result data */
    const [results, setResults] = useState<
        SearchResponse<EsDataset> | undefined
    >(undefined);

    /**
     * Flag indicating that the user has changed the state of the search form,
     * but has not executed the query
     */
    const [searchQueryNotYetExecuted, setSearchQueryNotYetExecuted] =
        useState<boolean>(false);

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const pageParameters = useMemo(() => {
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
            facetGcm: normaliseAsReadonlyStringArray(facetGcm),
        };
    }, [router.query]);

    // String search query value
    const [searchQuery, setSearchQuery] = useState<string>(
        pageParameters.searchQuery
    );

    // Users/principals to narrow datasets by
    const [filterPrincipals, setFilterPrincipals] = useState<string[]>([]);


    const setQueryParams = useCallback(
        (newParams: QueryParameters) => {
            router.push({
                query: stripEmptyStringQueryParams({
                    ...router.query,
                    ...newParams,
                }),
            });
        },
        [router.query]
    );

    // Facets
    // TODO: Implement some way of feeding the default state into the facets
    // from values contained in `pageParameters` so that they update the UI on
    // first load
    const [yearMin, setYearMin] = useState<string>("");
    const [yearMax, setYearMax] = useState<string>("");
     const facetStateTimeDomain = useFacetState(
        results?.aggregations?.facetTimeDomain?.buckets,
        pageParameters.facetTimeDomain,
        (items) => setQueryParams({
            facetTimeDomain: items,
        })
    );
    const facetStateSpatialDomain = useFacetState(
        results?.aggregations?.facetSpatialDomain?.buckets,
        [],
        () => {}
    );
    const facetStateResolution = useFacetState(
        results?.aggregations?.facetResolution?.buckets,
        [],
        () => {}
    );
    const facetStateScientificType = useFacetState(
        results?.aggregations?.facetScientificType?.buckets,
        [],
        () => {}
    );
    const facetStateDomain = useFacetState(
        results?.aggregations?.facetDomain?.buckets,
        [],
        () => {}
    );
    const facetStateGcm = useFacetState(
        results?.aggregations?.facetGcm?.buckets,
        [],
        () => {}
    );

    const totalNumberOfResults = useMemo(() => {
        // We'll say that there are 0 results if no data is available
        if (results === undefined) {
            return 0;
        }

        const total = results.hits.total;

        // Older Elasticsearch had number for `total`?
        if (typeof total === "number") {
            return total;
        } else {
            return (total as any).value as number;
        }
    }, [results, pageParameters]);

    const currentPageIndex = useMemo(
        () => Math.floor(pageParameters.pageStart / pageParameters.pageSize),
        [pageParameters]
    );

    const maxPages = useMemo(
        () => Math.ceil(totalNumberOfResults / pageParameters.pageSize),
        [totalNumberOfResults, pageParameters]
    );

    const yearsQueryIsAllYears = useMemo(
        () => yearMin === "" && yearMax === "",
        [yearMin, yearMax]
    );

    const yearsQueryMinBound = useMemo(
        () => results?.aggregations?.facetYearMin?.value || 0,
        [results]
    );

    const yearsQueryMaxBound = useMemo(
        () => results?.aggregations?.facetYearMax?.value || 0,
        [results]
    );

    /**
     * Handler to change page query parameter values via URL query parameters.
     */
    const onPageSelect = useCallback(
        (pageIndex: number) => {
            setQueryParams({
                pageSize: `${pageParameters.pageSize}`,
                pageStart: `${pageIndex * pageParameters.pageSize}`,
            });
        },
        [setQueryParams, pageParameters]
    );

    const handleQueryFormSubmit = useCallback(
        (e: FormEvent | MouseEvent) => {
            e.preventDefault();

            // Clear the "not yet executed" flag
            setSearchQueryNotYetExecuted(false);

            // Set query params of the page - this will trigger the effect to
            // launch the API call
            setQueryParams({
                // String search query
                searchQuery,

                // Users/principals
                filterPrincipals,

                // Facets
                facetYearMin: yearMin.toString(),
                facetYearMax: yearMax.toString(),
                facetTimeDomain: facetStateTimeDomain.getQueryParams(),
                facetSpatialDomain: facetStateSpatialDomain.getQueryParams(),
                facetResolution: facetStateResolution.getQueryParams(),
                facetScientificType: facetStateScientificType.getQueryParams(),
                facetDomain: facetStateDomain.getQueryParams(),
                facetGcm: facetStateGcm.getQueryParams(),

                // New queries must start at page 0
                pageStart: "0",
            });
        },
        [
            setQueryParams,

            // String search query change
            searchQuery,

            // Users/principals
            filterPrincipals,

            // If the facet selection changes, this callback needs updating
            yearMin,
            yearMax,
            facetStateTimeDomain.selectedItems,
            facetStateSpatialDomain.selectedItems,
            facetStateResolution.selectedItems,
            facetStateScientificType.selectedItems,
            facetStateDomain.selectedItems,
            facetStateGcm.selectedItems,
        ]
    );

    const handleSearchQueryInputChange = useCallback<
        ChangeEventHandler<HTMLInputElement>
    >((e) => {
        setSearchQuery(e.currentTarget.value);
    }, []);

    const handleYearAllYearsSwitchChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(() => {
        // Switching all years -> valued years: set min and max bounds
        if (yearsQueryIsAllYears) {
            setYearMin(yearsQueryMinBound);
            setYearMax(yearsQueryMaxBound);
            return;
        }

        // Switching valued years -> all years, set min and max blank
        setYearMin("");
        setYearMax("");
    }, [yearsQueryIsAllYears, yearsQueryMinBound, yearsQueryMaxBound]);

    const handleYearMinInputChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >((e) => {
        setYearMin(e.currentTarget.value.trim());
    }, []);

    const handleYearMaxInputChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >((e) => {
        setYearMax(e.currentTarget.value.trim());
    }, []);

    const handlePrivacySelectChange = useCallback<
        ChangeEventHandler<HTMLSelectElement>
    >(
        (e) => {
            const value = e.currentTarget.value;

            // If we have the current user's subject ID and they've chosen to
            // filter by private then set the filtered principals to subject ID
            if (value === "private" && keycloak?.subject !== undefined) {
                setFilterPrincipals([keycloak.subject]);
                return;
            }

            // Otherwise set blank
            setFilterPrincipals([]);
        },
        [keycloakToken, keycloak]
    );

    /**
     * An effect to automatically execute new Elasticsearch query upon page
     * parameter change, such as page increment or page size change.
     */
    useEffect(
        function executeEsQuery() {
            const {
                pageSize,
                pageStart,
                searchQuery,
                filterPrincipals,
                facetYearMin,
                facetYearMax,
                facetTimeDomain,
                facetSpatialDomain,
                facetResolution,
                facetScientificType,
                facetDomain,
                facetGcm,
            } = pageParameters;

            // Start building Elasticsearch query
            let queryBuilder = bodybuilder()
                .size(pageSize)
                .from(pageStart)
                // Facets are built up using aggregations
                //
                // For `year`, get the min and max values for the UI to
                // construct a range slide
                .aggregation("min", "year", "facetYearMin")
                .aggregation("max", "year", "facetYearMax")
                // All other aggregations are buckets of simple string values
                .aggregation("terms", "time_domain", "facetTimeDomain")
                .aggregation("terms", "spatial_domain", "facetSpatialDomain")
                .aggregation("terms", "resolution", "facetResolution")
                .aggregation("terms", "scientific_type", "facetScientificType")
                .aggregation("terms", "domain", "facetDomain")
                .aggregation("terms", "gcm", "facetGcm");

            let isEmptyQuery = true;

            // Add facets
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "time_domain",
                facetTimeDomain
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "spatial_domain",
                facetSpatialDomain
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "resolution",
                facetResolution
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "scientific_type",
                facetScientificType
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "domain",
                facetDomain
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "gcm",
                facetGcm
            );

            // Year range
            if (!Number.isNaN(facetYearMin) || !Number.isNaN(facetYearMax)) {
                isEmptyQuery = false;

                const yearRangeQuery: Record<string, number> = {};

                if (!Number.isNaN(facetYearMin)) {
                    yearRangeQuery["gte"] = facetYearMin;
                }

                if (!Number.isNaN(facetYearMax)) {
                    yearRangeQuery["lte"] = facetYearMax;
                }

                queryBuilder = queryBuilder.query(
                    "range",
                    "year",
                    yearRangeQuery
                );
            }

            // String search query
            if (searchQuery.length !== 0) {
                isEmptyQuery = false;

                // The search box value is used for a query against title
                // and description
                const innerQuery = bodybuilder()
                    .orQuery("match", "title", searchQuery)
                    .orQuery("match", "description", searchQuery);

                queryBuilder = queryBuilder.query(
                    "bool",
                    (innerQuery.build() as any).query.bool
                );
            }

            // If users/principals are provided, apply them as a filter
            if (filterPrincipals.length > 0) {
                // NOTE: This is a filter, so the `isEmptyQuery` flag does not
                // need to be set to `false`
                queryBuilder = queryBuilder.filter(
                    "terms",
                    "allowed_principals",
                    filterPrincipals
                );
            }

            // If query empty, attempt to fetch all
            if (isEmptyQuery) {
                queryBuilder = queryBuilder.query("match_all");
            }

            const query = queryBuilder.build();

            // `Authorization` header depends on whether token is available
            const headers: Record<string, string> = {};

            if (keycloakToken && keycloakToken.length > 0) {
                headers["Authorization"] = `Bearer ${keycloakToken}`;
            }

            const esQueryCancelToken = axios.CancelToken.source();

            axios
                .post<SearchResponse<EsDataset>>(
                    `${getDataExplorerBackendServerUrl()}/api/es/search/dataset`,
                    query,
                    { headers, cancelToken: esQueryCancelToken.token }
                )
                .then((res) => {
                    setResults(res.data);
                })
                .catch((e) => {
                    // Ignore cancellation events
                    if (axios.isCancel(e)) {
                        return;
                    }

                    console.error(e);

                    alert(e.toString());
                });

            return function stopOngoingEsQuery() {
                // Cancel the ES query if it is still running
                esQueryCancelToken.cancel();
            };
        },
        [pageParameters, keycloakToken]
    );

    useEffect(
        function updateSearchQueryNotYetExecutedState() {
            // If any of the monitored objects changes, this effect runs and will
            // set the "not yet executed" flag to `true`
            //
            // No `if` statement is required since we rely on React to do this
            setSearchQueryNotYetExecuted(true);
        },
        [
            // String search query changes
            searchQuery,

            // Users/principals
            filterPrincipals,

            // Facet selection changes
            yearMin,
            yearMax,
            facetStateTimeDomain.selectedItemKeyHash,
            facetStateSpatialDomain.selectedItemKeyHash,
            facetStateResolution.selectedItemKeyHash,
            facetStateScientificType.selectedItemKeyHash,
            facetStateDomain.selectedItemKeyHash,
            facetStateGcm.selectedItemKeyHash,
        ]
    );

    return (
        <>
                <Row>
                    Under construction
                    {/* <Col xs={2}>
                        <form onSubmit={handleQueryFormSubmit}>
                            <Row disableDefaultMargins>
                                <Col>
                                    <InputGroup
                                        data-testid="search-field"
                                        type="search"
                                        leftIcon="search"
                                        id="dataset-search"
                                        placeholder="Search datasets..."
                                        value={searchQuery}
                                        onChange={handleSearchQueryInputChange}
                                    />
                                </Col>
                            </Row>
                        </form>
                        <form
                            onSubmit={suppressEvent}
                            data-testid="facet-fields"
                        >
                            <Row>
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
                            </Row>
                            {[
                                {
                                    title: "Time domain",
                                    facetState: facetStateTimeDomain,
                                    placeholder: "Filter by time domain...",
                                },
                                {
                                    title: "Spatial domain",
                                    facetState: facetStateSpatialDomain,
                                    placeholder: "Filter by spatial domain...",
                                },
                                {
                                    title: "Resolution",
                                    facetState: facetStateResolution,
                                    placeholder: "Filter by resolution...",
                                },
                                {
                                    title: "Scientific type",
                                    facetState: facetStateScientificType,
                                    placeholder: "Filter by scientific type...",
                                },
                                {
                                    title: "Domain",
                                    facetState: facetStateDomain,
                                    placeholder: "Filter by domain...",
                                },
                                {
                                    title: "GCM",
                                    facetState: facetStateGcm,
                                    placeholder: "Filter by GCM...",
                                },
                            ].map(({ title, facetState, placeholder }) => (
                                <Row key={title}>
                                    <Col>
                                        <H6>{title}</H6>
                                        <FacetMultiSelectFacetState
                                            facetState={facetState}
                                            placeholder={placeholder}
                                        />
                                    </Col>
                                </Row>
                            ))}
                            <Row>
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
                            </Row>
                        </form>
                        <Row>
                            <Col>
                                <Button
                                    data-testid="search-submit-button"
                                    onClick={handleQueryFormSubmit}
                                    fill
                                    // If search form modified and not yet executed,
                                    // highlight via "success", otherwise just mute
                                    // its importance by using "none"
                                    intent={
                                        searchQueryNotYetExecuted
                                            ? "success"
                                            : "none"
                                    }
                                >
                                    Search &amp; apply filters
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={10}>
                        <Row disableDefaultMargins align="center">
                            <Col
                                className="bp3-ui-text bp3-text-disabled"
                                data-testid="results-count"
                            >
                                {totalNumberOfResults} result
                                {totalNumberOfResults !== 1 && "s"}
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
                                {results &&
                                    results.hits.hits.map(
                                        ({ _id, _source }) => (
                                            <DatasetCard
                                                data-testid="dataset-card"
                                                key={_id}
                                                datasetId={_source.uuid}
                                                title={_source.title}
                                                description={
                                                    _source.description
                                                }
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
                    </Col> */}
                </Row>
        </>
    );
}

import { Col, Row } from "@ecocommons-australia/ui-library";
import { FormEvent, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import bodybuilder from "bodybuilder";
import { Button, H6, Spinner, Popover, Position, PopoverInteractionKind, Icon, Tooltip, Classes } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import DatasetCard from "./DatasetCard";
import Pagination from "./Pagination";
import { DatasetType } from "../interfaces/DatasetType";

import { getDataExplorerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import { sendDatasetId } from "../util/messages";
import styles from "./FacetSelectFacetState2.module.css"

import {
    EsFacetRootConfig,
    QueryState,
    useEsFacetRoot,
    useEsIndividualFacetArray,
    useEsIndividualFacetFixedArray,
    useEsIndividualFacetFreeText,
    useEsIndividualFacetNumberRange,
} from "../hooks/EsFacet";
import FacetMultiSelectFacetState2, { NEW_TIME_DOMAIN_VAL, OLD_TIME_DOMAIN_VAL } from "./FacetMultiSelectFacetState2";
import FacetFreeTextFacetState2 from "./FacetFreeTextFacetState2";
import { itemSortKeyAlpha } from "./FacetMultiSelect";
import FacetNumberRangeFacetState2 from "./FacetNumberRangeFacetState2";
import FacetNumberRangeFacetStateSlider from "./FacetNumberRangeFacetStateSlider";
import FacetSelectFacetState2 from "./FacetSelectFacetState2";

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;
    /** Selected Dataset **/
    datasetId?: string;
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
    facetMonthMin?: string;
    facetMonthMax?: string;
}

interface FormState {
    pageSize: number;
    pageStart: number;
    searchQuery: string;
    datasetId: string;
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
    facetMonthMin: number;
    facetMonthMax: number;
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
        id: "facetYearMin",
        facetApplicationFn: (formState, query) => {
            const { facetYearMin, facetYearMax } = formState;

            // If both range values are NaN then the query is returned unchanged
            if (Number.isNaN(facetYearMin) && Number.isNaN(facetYearMax)) {
                return query;
            }

            const yearRangeQuery: Record<string, number> = {};

            if (!Number.isNaN(facetYearMin)) {
                yearRangeQuery["gte"] = facetYearMin;
            }

            if (!Number.isNaN(facetYearMax)) {
                yearRangeQuery["lte"] = facetYearMax;
            }

            return {
                modified: true,
                bodyBuilder: query.bodyBuilder.query(
                    "range",
                    "year",
                    yearRangeQuery
                ),
            };
        },
    },
    {
        // NOTE: The facet application function here is just returning the query
        // as-is, as the function declared for `facetYearMin` covers both
        //
        // TODO: Figure out how to configure paired/"range" facets across two
        // params properly
        id: "facetYearMax",
        facetApplicationFn: (formState, query) => {
            return query;
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
        facetApplicationFn: (formState, query) => {
            let newTimeDomain: string[] = [];
            if (formState.facetTimeDomain[0] === NEW_TIME_DOMAIN_VAL) {
                newTimeDomain = [OLD_TIME_DOMAIN_VAL]
            } else {
                formState.facetTimeDomain.map(item => {
                    newTimeDomain.push(item)
                })
            }
            return addTermAggregationFacetStateToQuery(
                query,
                "time_domain",
                newTimeDomain
            )
        },
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
    {
        id: "filterPrincipals",
        facetApplicationFn: (formState, query) => {
            if (formState.filterPrincipals.length === 0) {
                return query;           
            }

            if (formState.filterPrincipals.length > 0 && formState.filterPrincipals[0].startsWith("shared-")) {
                const userId = formState.filterPrincipals[0].replace('shared-','');
                return {
                    ...query,
                    bodyBuilder: query.bodyBuilder.notFilter(
                        "terms",
                        "allowed_principals",[userId,"role:admin"]
                    ),
                };
            }

            // NOTE: This is a filter that does not affect which query to run,
            // so the `modified` flag does not change
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.filter(
                    "terms",
                    "allowed_principals",
                    formState.filterPrincipals
                ),
            };
        },
    },
    {
        id: "facetMonthMin",
        facetApplicationFn: (formState, query) => {
            const { facetMonthMin, facetMonthMax } = formState;

            // If both range values are NaN then the query is returned unchanged
            if (Number.isNaN(facetMonthMin) && Number.isNaN(facetMonthMax)) {
                return query;
            }

            const monthRangeQuery: Record<string, number> = {};

            if (!Number.isNaN(facetMonthMin)) {
                monthRangeQuery["gte"] = facetMonthMin;
            }

            if (!Number.isNaN(facetMonthMax)) {
                monthRangeQuery["lte"] = facetMonthMax;
            }

            return {
                modified: true,
                bodyBuilder: query.bodyBuilder.query(
                    "range",
                    "month",
                    monthRangeQuery
                ),
            };
        },
    },
    {
        id: "facetMonthMax",
        facetApplicationFn: (formState, query) => {
            return query;
        },
    },
    {
        id: "datasetId",
        facetApplicationFn: (formState, query) => {
            const datasetId = formState.datasetId.trim();

            // If blank, don't apply this facet
            if (datasetId === undefined || datasetId === "") {
                return query;
            }

            // The search box value is used for a query against title
            // and description
            const innerQuery = bodybuilder()
                .orQuery("match", "uuid", datasetId)

            return {
                modified: true,
                bodyBuilder: query.bodyBuilder.query(
                    "bool",
                    (innerQuery.build() as any).query.bool
                ),
            };
        },
    },

];

export default function IndexPage() {
    const router = useRouter();

    const isEmbed = router.query.embed === "1";
    
    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const formState = useMemo<FormState>(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
            datasetId = "",
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
            facetMonthMin = "",
            facetMonthMax = "",
        } = router.query as QueryParameters;

        return {
            // Pagination
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,

            // String search query
            searchQuery,

            // Selected Dataset
            datasetId,

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
            facetMonthMin: parseInt(facetMonthMin, 10), // Value may be NaN
            facetMonthMax: parseInt(facetMonthMax, 10), // Value may be NaN
        };
    }, [router.query]);

    const updateFormState = useCallback(
        (formState: Partial<FormState>) => {
            // Copy out state and replace NaN values with empty strings
            //
            // This means that those keys with NaN values are removed from the
            // query params when it gets passed through
            // `stripEmptyStringQueryParams()` below
            const state = { ...formState };

            for (const key of Object.keys(state) as (keyof typeof state)[]) {
                if (Number.isNaN(state[key])) {
                    // Deliberately set the value as empty string
                    state[key] = "" as any;
                }
            }

            // Update query params for this page, which will update `formState`
            // above
            router.push({
                query: stripEmptyStringQueryParams({
                    ...router.query,
                    ...state,
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

    const facetYearRange = useEsIndividualFacetNumberRange(esFacetRoot, {
        minId: "facetYearMin",
        maxId: "facetYearMax",
        label: "Year",
    });

    const facetCollection = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetCollection",
        label: "Collection",
        placeholder: "Filter by collection...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetTimeDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetTimeDomain",
        label: "Time domain",
        placeholder: "Filter by time domain...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetSpatialDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetSpatialDomain",
        label: "Spatial domain",
        placeholder: "Filter by spatial domain...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetResolution = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetResolution",
        label: "Resolution",
        placeholder: "Filter by resolution...",
        itemSortFn: (a, b) => {
            const aName = a?.key;
            const bName = b?.key;

            if (aName === undefined || bName === undefined) {
                return 0;
            }

            // Parse "arcmin"/"arcsec" names
            const parseArcSecValueFromName = (x: string) => {
                const parts = x
                    .split(" ")
                    .filter((s) => s.trim().length !== 0)
                    .map((s) => s.toLowerCase());

                // Assume first is number, second is unit
                // e.g. "36 arcsec (...)"
                if (parts[1] === "arcsec") {
                    return Number.parseFloat(parts[0]);
                }

                if (parts[1] === "arcmin") {
                    return Number.parseFloat(parts[0]) * 60;
                }

                // Return NaN if we don't know what we're dealing with rather
                // than throwing as we don't want to completely crash the sort
                return Number.NaN;
            };

            const aValue = parseArcSecValueFromName(aName);
            const bValue = parseArcSecValueFromName(bName);

            if (aValue < bValue) {
                return -1;
            }

            if (aValue > bValue) {
                return 1;
            }

            return 0;
        },
    });

    const facetScientificType = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetScientificType",
        label: "Scientific type",
        placeholder: "Filter by scientific type...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetDomain = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetDomain",
        label: "Domain",
        placeholder: "Filter by domain...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetGcm = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetGcm",
        label: "Global Circulation Models",
        placeholder: "Filter by GCM...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetMonthRange = useEsIndividualFacetNumberRange(esFacetRoot, {
        minId: "facetMonthMin",
        maxId: "facetMonthMax",
        label: "Month",
    });

    const { keycloak } = useKeycloakInfo();

    const filterPrincipalsItems = useMemo(() => {
        // If user is signed in, provide option for viewing own data
        const userId = keycloak?.subject;

        return [
            { key: "all", label: "All datasets", disabled: false },
            {
                key: userId ?? "",
                label: "My datasets",
                disabled: userId === undefined || userId.length === 0,
            },
            {
                key: `shared-${userId}`,
                label: "Shared datasets",
                disabled: userId === undefined || userId.length === 0,
            },
        ];
    }, [keycloak?.subject]);

    const filterPrincipals = useEsIndividualFacetFixedArray(esFacetRoot, {
        id: "filterPrincipals",
        label: "Show Datasets ",
        items: filterPrincipalsItems,
        mapFromState: (allItems, itemKeys) => {       
            const selectedItemKeys = [...itemKeys];

            // Actively select "all" option if there is nothing in the item keys
            // array
            if (itemKeys.length === 0) {
                selectedItemKeys.push("all");
            }
 
            return selectedItemKeys.map((key) =>
                allItems.find((x) => x.key === key)
            );
        },
        mapToState: (items) => {
            // Drop "all" value as we don't need to store it in the state as
            // we won't need to include it in the query
            return items.map((x) => x.key).filter((x) => x !== "all");
        },
    });

    const currentPageIndex = useMemo(
        () => Math.floor(formState.pageStart / formState.pageSize),
        [formState.pageStart, formState.pageSize]
    );

    const maxPages = useMemo(
        () => Math.ceil(totalNumberOfResults / formState.pageSize),
        [totalNumberOfResults, formState.pageSize]
    );

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

    const onDatasetSelect = useCallback(
        (uuid: string) => {
            sendDatasetId(uuid);
            updateFormState({
                datasetId: uuid
            });
        },
        [updateFormState]
    );

    const resetAll = useCallback(() => {
        updateFormState({
            "facetYearMin": NaN,
            "facetYearMax": NaN,
            "facetCollection": [],
            "facetTimeDomain": [],
            "facetSpatialDomain": [],
            "facetResolution": [],
            "facetScientificType": [],
            "facetDomain": [],
            "facetGcm": [],
            "filterPrincipals": [],
            "facetMonthMin": NaN,
            "facetMonthMax": NaN,
        })
    },[])
  
    const renderFacetLabel = (facetId: string, facetLabel: string) => {
        if (facetId === "facetGcm") {
            return <H6>{facetLabel}&nbsp;
             <Popover  position={Position.TOP_LEFT}
                        autoFocus={false}
                        interactionKind={PopoverInteractionKind.HOVER}
                        content={<span className={styles.toolTip}>
                            For more information click <a href="https://www.ipcc-data.org/guidelines/pages/gcm_guide.html" target="_blank">here</a>!
                        </span>}>
                        <a><Icon icon="info-sign" iconSize={15} /></a>
                    </Popover>
                </H6>;
        } else {
            return <H6>{facetLabel}</H6>;
        }
    }

    return (
        <Row data-cy="ExploreEcoDataTab">
            <Col xs={2}>
                <Row disableDefaultMargins>
                    <Col>
                        <FacetFreeTextFacetState2
                            facet={searchQuery}
                            data-testid="search-field"
                            data-cy="search-field"
                            type="search"
                            leftIcon="search"
                            rightElement={
                                searchQuery.value.length > 0 ? (
                                    <Button
                                        icon="small-cross"
                                        minimal
                                        onClick={() =>
                                            searchQuery.onValueChange("")
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
                <form onSubmit={suppressEvent} data-testid="facet-fields">
                <FacetSelectFacetState2 facet={filterPrincipals} />
                    <Row>
                        <Col>
                            <FacetNumberRangeFacetState2
                                facet={facetYearRange}
                                defaultMin={1990}
                                defaultMax={2010}
                                numberParseMode="integer"
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FacetNumberRangeFacetStateSlider
                                facet={facetMonthRange}
                                defaultMin={1}
                                defaultMax={12}
                            />
                        </Col>
                    </Row>
                    {[
                        facetTimeDomain,
                        facetSpatialDomain,
                        facetResolution,
                        facetScientificType,
                        facetDomain,
                        facetGcm,
                        facetCollection,
                    ].map((facet) => (
                        <Row key={facet.id}>
                            <Col>
                                {renderFacetLabel(facet.id, facet.label)}
                                <FacetMultiSelectFacetState2
                                    data-cy={"facet-"+facet.id+"-select"}
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
                </form>
                <Row>
                    <Col style={{ textAlign: "right" }}>
                        <Button
                            icon="reset"
                            data-testid="reset-all-button"
                            intent="primary"
                            onClick={resetAll}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>
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
                        {queryResult?.hits.hits.map(({ _id, _source }) => (
                            <DatasetCard
                                data-cy="dataset-card"
                                data-testid="dataset-card"
                                key={_id}
                                datasetId={_source.uuid}
                                title={_source.title}
                                description={_source.description}
                                status={_source.status}
                                downloadable={_source.downloadable}
                                failureMessage={
                                    _source.status === "FAILED"
                                        ? _source.message
                                        : undefined
                                }
                                type={
                                    _source.status === "SUCCESS"
                                        ? // TODO: Clarify values for "scientific_type"
                                          ({
                                              type: _source.scientific_type[0],
                                              subtype:
                                                  _source.scientific_type[1],
                                          } as unknown as DatasetType)
                                        : undefined
                                }
                                // TODO: Add modification date into ES index
                                // lastUpdated={lastUpdated}
                                ownerId={_source.allowed_principals as string[]}
                                selected={formState.datasetId === _source.uuid}
                                onSelect={Boolean(isEmbed) ? onDatasetSelect : undefined}
                            />
                        ))}
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
    );
}

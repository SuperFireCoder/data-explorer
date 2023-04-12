import { Col, Row } from "@ecocommons-australia/ui-library";
import { FormEvent, useCallback, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import bodybuilder from "bodybuilder";
import { Button, H6, Spinner, Popover, Position, PopoverInteractionKind, Icon, Tooltip, Classes } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";
import DatasetCard from "./DatasetCard";
import Pagination from "./Pagination";
import { DatasetType } from "../interfaces/DatasetType";
import { useEffectTrigger } from "../hooks/EffectTrigger";

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
import { itemSortKeyAlpha, monthItemSort, resolutionItemSort } from "./FacetMultiSelect";
import FacetNumberRangeFacetState2 from "./FacetNumberRangeFacetState2";
import FacetSelectFacetState2 from "./FacetSelectFacetState2";

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;
    /** Search Dataset **/
    datasetId?: string;
    /** Selected Dataset **/
    selectedDatasetId?: string;
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
    facetMonth?: string | string[];
    facetDataCategory?: string | string[];
}

interface FormState {
    pageSize: number;
    pageStart: number;
    searchQuery: string;
    datasetId: string;
    selectedDatasetId: string;
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
    facetMonth: readonly string[];
    facetDataCategory: readonly string[];
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
        (x) => (innerQuery = innerQuery.orQuery("match", facetEsTerm, x).rawOption("track_total_hits",true))
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

/**
 * Adds terms aggregation based facets to given bodybuilder query instance, and
 * a carrying boolean flag that indicates whether the query is "empty" (that is,
 * whether the query has had filters applied such as prior facets or some string
 * query.)
 *
 * @param queryState
 * @param facetEsTerms String identifier for the terms used in Elasticsearch query
 * @param facetValues
 */
 function addTermsAggregationFacetStateToQuery(
    queryState: QueryState,
    facetEsTerms: string[],
    facetValues: readonly string[]
): QueryState {
    // If nothing selected for this facet, return state untouched
    if (facetValues.length === 0) {
        return queryState;
    }

    // Add all selected facet values
    let innerQuery = bodybuilder();
    console.log(facetValues,facetEsTerms)

     facetValues.forEach(
         (x) => (facetEsTerms.forEach(facetEsTerm => innerQuery = innerQuery.orQuery("match", facetEsTerm, x)))
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
                .orQuery("match", "description", searchQuery)
                .orQuery("wildcard", "title", `*${searchQuery}*`)
                .orQuery("wildcard", "description", `*${searchQuery}*`)
                .rawOption("track_total_hits", true);

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
                formState.facetTimeDomain.map(item => {
                    const newitem =(item === NEW_TIME_DOMAIN_VAL) ? OLD_TIME_DOMAIN_VAL : item
                    newTimeDomain.push(newitem)
                })
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

                const innerQuery = bodybuilder().notFilter(
                    "terms",
                    "allowed_principals",
                    [userId, "role:admin"]
                ).rawOption("track_total_hits", true);

                return {
                    ...query,
                    bodyBuilder: query.bodyBuilder.query(
                        "bool",
                        (innerQuery.build() as any).query.bool
                    ),
                };
            }

            // NOTE: still need to investigate how to improve filterPrincipals
            const innerQuery = bodybuilder().filter(
                "terms",
                "allowed_principals",
                formState.filterPrincipals
            ).rawOption("track_total_hits", true);
            
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.query(
                    "bool",
                    (innerQuery.build() as any).query.bool
                ),
            };
        },
    },
    {
        id: "facetMonth",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "month",
                formState.facetMonth
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "month",
                    { size: 1000000 },
                    "facetMonth"
                ),
            };
        },
    },
    {
        id: "facetDataCategory",
        facetApplicationFn: (formState, query) =>
        addTermsAggregationFacetStateToQuery(
                query,
                ["domain, scientific_type"],
                formState.facetDataCategory
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation("terms", "domain",  "facetDataCategory"
                )
                .aggregation
                ("terms", "scientific_type",  "facetDataCategory"
                ),
            };
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
                .orQuery("match", "uuid", datasetId).rawOption("track_total_hits",true);

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

    const allowChangeFilterPrinciples = router.query.allow_change_filterPrinciples !== "0";

    const [datasetUUIDToDelete, setDatasetUUIDToDelete] =
        useState<string | undefined>(undefined);
    const {
        triggerValue: searchTriggerValue,
        triggerEffect: triggerSearch,
    } = useEffectTrigger();

    const [datasetHistory, setDatasetHistory] = useState<
        { lastUpdated: Date; } | undefined
    >(undefined);


    useEffect(
        function setupReloadInterval() {
            // Trigger job fetch every 30 seconds
            setDatasetHistory({
                lastUpdated: new Date(),
            });
            const intervalHandle = window.setInterval(() => {
                triggerSearch();
            }, 30000);

            return function stopReloadJobsInterval() {
                window.clearInterval(intervalHandle);
            };
        },
        [triggerSearch]
    );

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

            // Remove the OLD_TIME_DOMAIN_VAL from the routing url to avoid conflict
            if (state["facetTimeDomain"] !== undefined) {
                let selectedTimeDomainItems: (string)[] = []
                state["facetTimeDomain"].forEach(element => {
                    if (router.query.facetTimeDomain !== undefined && element === OLD_TIME_DOMAIN_VAL && (router.query.facetTimeDomain?.includes(OLD_TIME_DOMAIN_VAL))) {
                        //avoid adding the items to list
                    } else {
                        selectedTimeDomainItems.push(element)
                    }
                });
                state["facetTimeDomain"] = selectedTimeDomainItems?.filter((v, i) => selectedTimeDomainItems?.indexOf(v) == i)
            }

            // Set back defaults for all datasets
            if (formState.filterPrincipals?.length === 0) {
                state["facetMonth"] = ["Non monthly data"]
                state["facetTimeDomain"] = [NEW_TIME_DOMAIN_VAL]
            }
            // Disable defaults for shared and owned datasets
            if (formState.filterPrincipals !== undefined && formState.filterPrincipals.length > 0) {
                state["facetTimeDomain"] = []
                state["facetMonth"] = []
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


    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const formState = useMemo<FormState>(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
            datasetId = "",
            selectedDatasetId = "",
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
            facetMonth = [],
            facetDataCategory=[]
        } = router.query as QueryParameters;

        setDatasetHistory({
            lastUpdated: new Date(),
        });

        return {
            // Pagination
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,

            // String search query
            searchQuery,

            // Searched Dataset
            datasetId,

            // Selected Dataset
            selectedDatasetId,

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
            facetMonth: normaliseAsReadonlyStringArray(facetMonth),
            facetDataCategory: normaliseAsReadonlyStringArray(facetDataCategory),
        };
    }, [router.query,searchTriggerValue]);

    useEffect(() => {
        const state = { ...formState };
        if (state["facetMonth"].length === 0 || state["facetTimeDomain"].length === 0) {
            state["facetMonth"] = ["Non monthly data"]
            state["facetTimeDomain"] = [NEW_TIME_DOMAIN_VAL, OLD_TIME_DOMAIN_VAL]
            triggerSearch()
            router.replace({
                query: stripEmptyStringQueryParams({
                    ...state,
                }),
            });
        }
    }, []);

    const getProcessedQueryResult = (): Array<any> | undefined => {
        //Removes dataset from dataset list if user deleted it.
        if (datasetUUIDToDelete && queryResult) {
            let indexToDelete = queryResult?.hits.hits.findIndex(x => x._source.uuid == datasetUUIDToDelete)
            setDatasetUUIDToDelete(undefined)
            if (indexToDelete !== -1) // if matching uuid is found, return spliced dataset list
            {
                return queryResult.hits.hits.splice(indexToDelete, 1)
            }
            else {
                return queryResult.hits.hits
            }
        }
        else {
            return queryResult?.hits.hits
        }

    }

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
        itemSortFn: resolutionItemSort,
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

    const facetMonth = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetMonth",
        label: "Month filter",
        placeholder: "Filter by month...",
        itemSortFn: monthItemSort,
    });

    const facetDataCategory = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetDataCategory",
        label: "Data Category",
        placeholder: "Filter by data category...",
        itemSortFn: itemSortKeyAlpha,
    });

    const { keycloak } = useKeycloakInfo();

    const filterPrincipalsItems = useMemo(() => {
        // If user is signed in, provide option for viewing own data
        const userId = keycloak?.subject;

        if (userId === undefined) {
            return [];
        } else {
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
        }
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
                selectedDatasetId: uuid
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
            // "filterPrincipals": [],
            "facetMonth": [],
            "facetDataCategory": []
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

                    <FacetSelectFacetState2
                        data-cy="facet-filter-principals-select"
                        facet={filterPrincipals}
                        allowChangeFilterPrinciples={allowChangeFilterPrinciples}
                    />

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
                    {[
                        facetMonth,
                        facetTimeDomain,
                        facetSpatialDomain,
                        facetResolution,
                        facetScientificType,
                        facetDomain,
                        facetGcm,
                        facetCollection,
                        facetDataCategory
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
                    <Col xs={6}>
                            <div style={{ textAlign: "right" }}>
                                <Button
                                    icon="refresh"
                                    minimal
                                    small
                                    onClick={triggerSearch}
                                >
                                    {datasetHistory?.lastUpdated && (
                                <>
                                    Last refreshed at{" "}
                                    {new Intl.DateTimeFormat(undefined, {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",

                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    }).format(datasetHistory.lastUpdated)}
                                        </>
                                    )}
                                </Button>
                            </div>
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
                        {getProcessedQueryResult()?.map(({ _id, _source }) => (
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
                                selected={formState.selectedDatasetId === _source.uuid}
                                onSelect={isEmbed === true ? onDatasetSelect : undefined}
                                setDatasetUUIDToDelete={setDatasetUUIDToDelete}
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

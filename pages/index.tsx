import {
    FixedContainer,
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";
import {
    FormEvent,
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
import { InputGroup, Button, H6 } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import Header from "../components/Header";
import DatasetCard from "../components/DatasetCard";
import Pagination from "../components/Pagination";
import FacetMultiSelectFacetState from "../components/FacetMultiSelectFacetState";
import { EsDataset } from "../interfaces/EsDataset";
import { DatasetType } from "../interfaces/DatasetType";
import { useFacetState } from "../hooks/FacetState";
import { getDataExplorerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";

const subBarLinks = [
    { key: "explore", href: "/data", label: "Explore data" },
    {
        key: "my-data",
        href: "https://example.com/data/my-data",
        label: "My data and results",
    },
    {
        key: "import",
        href: "https://example.com/data/import",
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

function normaliseFacetPageParam(facet: string | string[]) {
    return typeof facet === "string" ? [facet] : facet;
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

export default function IndexPage() {
    const { keycloak } = useKeycloakInfo();
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement | null>(null);

    const keycloakToken = keycloak?.token;

    /** Elasticsearch search response result data */
    const [results, setResults] = useState<
        SearchResponse<EsDataset> | undefined
    >(undefined);

    // Facets
    const facetStateTimeDomain = useFacetState(
        results?.aggregations?.facetTimeDomain?.buckets
    );
    const facetStateSpatialDomain = useFacetState(
        results?.aggregations?.facetSpatialDomain?.buckets
    );
    const facetStateResolution = useFacetState(
        results?.aggregations?.facetResolution?.buckets
    );
    const facetStateScientificType = useFacetState(
        results?.aggregations?.facetScientificType?.buckets
    );
    const facetStateDomain = useFacetState(
        results?.aggregations?.facetDomain?.buckets
    );
    const facetStateGcm = useFacetState(
        results?.aggregations?.facetGcm?.buckets
    );

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const pageParameters = useMemo(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
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

            // Facets
            facetTimeDomain: normaliseFacetPageParam(facetTimeDomain),
            facetSpatialDomain: normaliseFacetPageParam(facetSpatialDomain),
            facetResolution: normaliseFacetPageParam(facetResolution),
            facetScientificType: normaliseFacetPageParam(facetScientificType),
            facetDomain: normaliseFacetPageParam(facetDomain),
            facetGcm: normaliseFacetPageParam(facetGcm),
        };
    }, [router.query]);

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
        (e: FormEvent) => {
            e.preventDefault();

            // Get the search box value
            const searchQuery = searchRef.current?.value?.trim() || "";

            setQueryParams({
                // String search query
                searchQuery,

                // Facets
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

            // If the facet selection changes, this callback needs updating
            facetStateTimeDomain.selectedItems,
            facetStateSpatialDomain.selectedItems,
            facetStateResolution.selectedItems,
            facetStateScientificType.selectedItems,
            facetStateDomain.selectedItems,
            facetStateGcm.selectedItems,
        ]
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

    return (
        <>
            <HtmlHead title={["Data and Visualisations", "Explore data"]} />
            <Header
                activeTab="data"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
            <FixedContainer>
                <Row>
                    <Col>
                        <form onSubmit={handleQueryFormSubmit}>
                            <InputGroup
                                type="search"
                                leftIcon="search"
                                id="dataset-search"
                                inputRef={searchRef}
                                placeholder="Search datasets..."
                                defaultValue={pageParameters.searchQuery}
                            />
                            <Button
                                type="submit"
                                data-testid="search-submit-button"
                            >
                                Search
                            </Button>
                        </form>

                        <form
                            onSubmit={(e) => {
                                e.stopPropagation(), e.preventDefault();
                            }}
                        >
                            <H6>Time domain</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateTimeDomain}
                                placeholder="Filter by time domain..."
                            />
                            <H6>Spatial domain</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateSpatialDomain}
                                placeholder="Filter by spatial domain..."
                            />
                            <H6>Resolution</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateResolution}
                                placeholder="Filter by resolution..."
                            />
                            <H6>Scientific type</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateScientificType}
                                placeholder="Filter by scientific type..."
                            />
                            <H6>Domain</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateDomain}
                                placeholder="Filter by domain..."
                            />
                            <H6>GCM</H6>
                            <FacetMultiSelectFacetState
                                facetState={facetStateGcm}
                                placeholder="Filter by GCM..."
                            />
                        </form>
                    </Col>
                </Row>
                <Row align="center">
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
                            results.hits.hits.map(({ _id, _source }) => (
                                <DatasetCard
                                    data-testid="dataset-card"
                                    key={_id}
                                    datasetId={_source.uuid}
                                    title={_source.title}
                                    description={_source.description}
                                    type={
                                        _source.status === "SUCCESS"
                                            ? // TODO: Clarify values for "scientific_type"
                                              (({
                                                  type:
                                                      _source
                                                          .scientific_type[0],
                                                  subtype:
                                                      _source
                                                          .scientific_type[1],
                                              } as unknown) as DatasetType)
                                            : undefined
                                    }
                                    // TODO: Add modification date into ES index
                                    // lastUpdated={lastUpdated}
                                />
                            ))}
                    </Col>
                </Row>
                <Row style={{ marginTop: "1rem" }}>
                    <Col style={{ textAlign: "right" }}>
                        <Pagination
                            currentIndex={currentPageIndex}
                            max={maxPages}
                            onSelect={onPageSelect}
                        />
                    </Col>
                </Row>
            </FixedContainer>
        </>
    );
}

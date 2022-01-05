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
import MetadataDrawer from "./MetadataDrawer";
import { readdirSync } from "fs";

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

    facetPublisher?: string | string[];
    facetFormat?: string | string[];
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
 * @param queryType bool || nested
 *
 * @returns Array of [new bodyBuilder query instance, `isEmptyQuery` boolean]
 */
function addTermAggregationFacetStateToQuery(
    queryBuilder: Bodybuilder,
    isEmptyQuery: boolean,
    facetEsTerm: string,
    facetValues: readonly string[],
    queryType = ""
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
    
    let newQueryBuilder = queryBuilder;
    
    if (queryType === "bool") {
        newQueryBuilder = innerQuery
    }

    if (queryType === "nested") {
        newQueryBuilder = newQueryBuilder
                            .orQuery('nested', 'path', 'distributions', (q) => {
                            return q.orQuery('terms', 'distributions.format.keyword', facetValues)
                            })
    }

    console.log('new query', newQueryBuilder.build(), facetValues);
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
    const [ knDataStatus, setknDataStatus ] = useState({status: "", message: ""}); 
    /**
     * "Restricted" set of publishers which are determined to contain
     * environmental data; this is delivered from our own CSV data source
     *
     * @type {{ id: string, name: string }[]}
     */
    let restrictedPubs = [];

    /** Elasticsearch search response result data */
    const [results, setResults] = useState<
        SearchResponse<EsDataset> | undefined
    >(undefined);

    /** Elasticsearch data */
    const [globalBucket, setGlobalBucket] = useState<
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
            facetPublisher = [],
            facetFormat = [],
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
            facetPublisher: normaliseAsReadonlyStringArray(facetPublisher),
            facetFormat: normaliseAsReadonlyStringArray(facetFormat),
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
     const facetStatePublisher = useFacetState(
        globalBucket?.aggregations?.facetPublisher?.buckets,
        pageParameters.facetPublisher,
        (items) => setQueryParams({
            facetPublisher: items,
        })
    );
    const facetStateFormat = useFacetState(
        globalBucket?.aggregations?.distributions?.facetFormat?.buckets,
        pageParameters.facetFormat,
        (items) => setQueryParams({
            facetFormat: items,
        })
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
                facetPublisher: facetStatePublisher.getQueryParams(),
                facetFormat: facetStateFormat.getQueryParams(),

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
            facetStatePublisher.selectedItems,
            facetStateFormat.selectedItems,
        ]
    );

    const handleSearchQueryInputChange = useCallback<
        ChangeEventHandler<HTMLInputElement>
    >((e) => {
        setSearchQuery(e.currentTarget.value);
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
    
    useEffect(
        function executeInitialAggregationFetch() {
            // Facets are built up using aggregations
            const queryBuilder = bodybuilder()
                .aggregation('nested', {path: 'distributions'}, 'distributions', (a) => {
                    return a.aggregation('terms', 'distributions.format.keyword', 'facetFormat', {size: 10000})
                  })
                .aggregation('terms', 'publisher.name.keyword', 'facetPublisher', {size: 10000});

            const query = queryBuilder.build();

            console.log('QUERY kn global: ', query);

            // `Authorization` header depends on whether token is available
            const headers: Record<string, string> = {};

            if (keycloakToken && keycloakToken.length > 0) {
                headers["Authorization"] = `Bearer ${keycloakToken}`;
            }

            const esQueryCancelToken = axios.CancelToken.source();
            
            axios
                .post<SearchResponse<EsDataset>>(
                    `https://knowledgenet.co/api/v0/es-query/datasets`,
                    query,
                    { headers, cancelToken: esQueryCancelToken.token }
                )
                .then((res) => {
                    setGlobalBucket(res.data);
                    console.log('kn res', res, res.status);
                    if(res.status === 200) {
                        setknDataStatus({status: "SUCCESS", message:""});
                        console.log('kn res', "200");
                    }
                })
                .catch((e) => {
                    // Ignore cancellation events
                    if (axios.isCancel(e)) {
                        return;
                    }

                    console.error(e);
                    const err = e.toString();
                    setknDataStatus({status: "FAILED", message:err});
                    alert(e.toString());
                });

            return function stopOngoingEsQuery() {
                // Cancel the ES query if it is still running
                esQueryCancelToken.cancel();
            };
        },
        [
            // TODO: This global bucket needs to be rerun depending on Keycloak/user sign-in status
            keycloakToken
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
                filterPrincipals,
                facetPublisher,
                facetFormat,
            } = pageParameters;

            // Start building Elasticsearch query
            let queryBuilder = bodybuilder()
                .size(pageSize)
                .from(pageStart)

            let isEmptyQuery = true;

            // Add facets
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "publisher.name.keyword",
                facetPublisher,
                "bool"
            );
            [queryBuilder, isEmptyQuery] = addTermAggregationFacetStateToQuery(
                queryBuilder,
                isEmptyQuery,
                "distributions.format.keyword",
                facetFormat,
                "nested"
            );
            
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
                // queryBuilder = queryBuilder.query("match_all");
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
                    `https://knowledgenet.co/api/v0/es-query/datasets`,
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
            facetStatePublisher.selectedItemKeyHash,
            facetStateFormat.selectedItemKeyHash,
        ]
    );

    return (
        <>
                <Row>
                    <Col xs={2}>
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
                            {[
                                {
                                    title: "Publisher",
                                    facetState: facetStatePublisher,
                                    placeholder: "Filter by publisher...",
                                },
                                {
                                    title: "Resource Type",
                                    facetState: facetStateFormat,
                                    placeholder: "Filter by resrouce type...",
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
                            {/* <MetadataDrawer
                                drawerTitle={"test"}
                                datasetId={"ds-listtas-326cb4f7-2072-4ad8-84c6-22d3334fabad"}
                                isOpen={true}
                                onClose={() => {return false}}
                                exploreDataType={"knowledgeNetwork"}
                            /> */}
                                {results &&
                                    results.hits.hits.map(
                                        ({ _id, _source }) => (
                                            <DatasetCard
                                                data-testid="dataset-card"
                                                key={_id}
                                                datasetId={_source.identifier}
                                                title={_source.title}
                                                description={
                                                    _source.description
                                                }
                                                status={knDataStatus.status}
                                                failureMessage={
                                                    knDataStatus.status === "FAILED"
                                                        ? knDataStatus.message
                                                        : undefined
                                                }
                                                type={
                                                    knDataStatus.status === "SUCCESS"
                                                        ? // TODO: Clarify values for "scientific_type"
                                                        undefined
                                                        //   (
                                                            
                                                        //     {
                                                        //     //   type: _source
                                                        //     //       .scientific_type[0],
                                                        //     //   subtype:
                                                        //     //       _source
                                                        //     //           .scientific_type[1],
                                                        //   } as unknown as DatasetType)
                                                        : undefined
                                                }
                                                exploreDataType="knowledgeNetwork"
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
                    </Col>
                </Row>
        </>
    );
}

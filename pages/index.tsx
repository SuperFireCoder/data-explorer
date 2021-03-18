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
import bodybuilder from "bodybuilder";
import axios from "axios";
import { InputGroup, Button } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import Header from "../components/Header";
import DatasetCard from "../components/DatasetCard";
import Pagination from "../components/Pagination";
import { EsDataset } from "../interfaces/EsDataset";
import { DatasetType } from "../interfaces/DatasetType";
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

export default function IndexPage() {
    const { keycloak } = useKeycloakInfo();
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement | null>(null);

    const keycloakToken = keycloak?.token;

    /** Elasticsearch search response result data */
    const [results, setResults] = useState<
        SearchResponse<EsDataset> | undefined
    >(undefined);

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const pageParameters = useMemo(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
        } = router.query as QueryParameters;

        return {
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,
            searchQuery,
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
                searchQuery,

                // New queries must start at page 0
                pageStart: "0",
            });
        },
        [setQueryParams]
    );

    /**
     * An effect to automatically execute new Elasticsearch query upon page
     * parameter change, such as page increment or page size change.
     */
    useEffect(
        function executeEsQuery() {
            const { pageSize, pageStart, searchQuery } = pageParameters;

            // Start building Elasticsearch query
            let queryBuilder = bodybuilder().size(pageSize).from(pageStart);

            if (searchQuery.length === 0) {
                // If search box is empty, attempt to fetch all
                queryBuilder = queryBuilder.query("match_all");
            } else {
                // The search box value is used for a query against title
                // and description
                queryBuilder = queryBuilder
                    .orQuery("match", "title", searchQuery)
                    .orQuery("match", "description", searchQuery);
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
                                rightElement={
                            <Button
                                type="submit"
                                data-testid="search-submit-button"
                                        small
                                        style={{
                                            borderRadius: "30px",
                                            padding: "0 0.8rem",
                                        }}
                            >
                                Search
                            </Button>
                                }
                                id="dataset-search"
                                inputRef={searchRef}
                                placeholder="Search datasets..."
                                defaultValue={pageParameters.searchQuery}
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

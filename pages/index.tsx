import { FixedContainer, HtmlHead } from "@ecocommons-australia/ui-library";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchResponse } from "elasticsearch";
import { useRouter } from "next/router";
import { Col, Row } from "react-grid-system";
import bodybuilder from "bodybuilder";
import axios from "axios";

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
}

export default function IndexPage() {
    const { keycloak } = useKeycloakInfo();
    const router = useRouter();

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
        } = router.query as QueryParameters;

        return {
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,
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

    /**
     * Handler to change page query parameter values via URL query parameters.
     */
    const onPageSelect = useCallback(
        (pageIndex: number) => {
            router.push({
                query: {
                    ...router.query,
                    pageSize: pageParameters.pageSize,
                    pageStart: pageIndex * pageParameters.pageSize,
                },
            });
        },
        [router.query, pageParameters]
    );

    /**
     * An effect to automatically execute new Elasticsearch query upon page
     * parameter change, such as page increment or page size change.
     */
    useEffect(
        function executeEsQuery() {
            const { pageSize, pageStart } = pageParameters;
            const query = bodybuilder()
                .query("match_all")
                .size(pageSize)
                .from(pageStart)
                .build();

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
                <Row style={{ marginTop: "1rem" }} align="center">
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
                <Row style={{ marginTop: "1rem" }}>
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

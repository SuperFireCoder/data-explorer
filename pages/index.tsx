import { FixedContainer, HtmlHead } from "@ecocommons-australia/ui-library";
import { Col, Row } from "react-grid-system";
import DatasetCard from "../components/DatasetCard";
import bodybuilder from "bodybuilder";
import axios from "axios";

import Header from "../components/Header";
import Pagination from "../components/Pagination";
import { DatasetType } from "../interfaces/DatasetType";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EsDataset } from "../interfaces/EsDataset";
import { useRouter } from "next/router";

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
    const router = useRouter();

    const [results, setResults] = useState<any>(undefined);

    const pageSettings = useMemo(() => {
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
        if (results === undefined) {
            return 0;
        }

        return results.hits.total.value;
    }, [results, pageSettings]);

    const currentPageIndex = useMemo(() => {
        return Math.floor(pageSettings.pageStart / pageSettings.pageSize);
    }, [pageSettings]);

    const maxPages = useMemo(() => {
        return Math.ceil(totalNumberOfResults / pageSettings.pageSize);
    }, [totalNumberOfResults, pageSettings]);

    const onPageSelect = useCallback(
        (pageIndex: number) => {
            router.push({
                query: {
                    ...router.query,
                    pageSize: pageSettings.pageSize,
                    pageStart: pageIndex * pageSettings.pageSize,
                },
            });
        },
        [router.query, pageSettings]
    );

    useEffect(
        function executeEsQuery() {
            const { pageSize, pageStart } = pageSettings;
            const query = bodybuilder()
                .query("match_all")
                .size(pageSize)
                .from(pageStart)
                .build();

            axios
                .post("http://localhost:8000/api/es/search/dataset", query)
                .then((res) => {
                    setResults(res.data);
                })
                .catch((e) => {
                    console.error(e);
                    alert(e.toString());
                });

            // No cleanup required here

            // TODO: Cancel existing request if still running
        },
        [router.query, pageSettings]
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
                    <Col className="bp3-ui-text bp3-text-disabled">
                        {totalNumberOfResults} result
                        {totalNumberOfResults !== 1 && "s"}
                    </Col>
                    <Col style={{ textAlign: "right" }}>
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
                            results.hits.hits.map(
                                ({ _id, _source }: EsDataset) => (
                                    <DatasetCard
                                        key={_id}
                                        title={_source.title}
                                        description={_source.description}
                                        type={
                                            {
                                                type:
                                                    _source.scientific_type[0],
                                                subtype:
                                                    _source.scientific_type[1],
                                            } as any
                                        }
                                        // lastUpdated={lastUpdated}
                                    />
                                )
                            )}
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

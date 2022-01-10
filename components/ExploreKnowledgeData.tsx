import { Col, Row } from "@ecocommons-australia/ui-library";
import { FormEvent, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import bodybuilder from "bodybuilder";
import { Button, H6, Spinner } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import DatasetCard from "./DatasetCard";
import Pagination from "./Pagination";
import { EsDatasetKN } from "../interfaces/EsDatasetKN";
import {
    EsFacetRootConfig,
    QueryState,
    useEsFacetRoot,
    useEsIndividualFacetArray,
    useEsIndividualFacetFreeText,
} from "../hooks/EsFacet";
import { itemSortKeyAlpha } from "./FacetMultiSelect";
import FacetFreeTextFacetState2 from "./FacetFreeTextFacetState2";
import FacetMultiSelectFacetState2 from "./FacetMultiSelectFacetState2";

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;

    facetPublisher?: string | string[];
    facetFormat?: string | string[];
}

interface FormState {
    pageSize: number;
    pageStart: number;
    searchQuery: string;
    facetPublisher: readonly string[];
    facetFormat: readonly string[];
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
 * @param queryType bool || nested
 */
function addTermAggregationFacetStateToQuery(
    queryState: QueryState,
    facetEsTerm: string,
    facetValues: readonly string[],
    queryType: "bool" | "nested"
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

    let newQueryBuilder = queryState.bodyBuilder;

    if (queryType === "bool") {
        newQueryBuilder = newQueryBuilder.query(
            "bool",
            (innerQuery.build() as any).query.bool
        );
    }

    if (queryType === "nested") {
        newQueryBuilder = newQueryBuilder.query(
            "nested",
            "path",
            "distributions",
            (q) => {
                return q.orQuery(
                    "terms",
                    "distributions.format.keyword",
                    facetValues
                );
            }
        );
    }

    // console.log("new query", newQueryBuilder.build(), facetValues);
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
        id: "facetPublisher",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "publisher.name.keyword",
                formState.facetPublisher,
                "bool"
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "terms",
                    "publisher.name.keyword",
                    "facetPublisher",
                    { size: 10000 }
                ),
            };
        },
    },
    {
        id: "facetFormat",
        facetApplicationFn: (formState, query) =>
            addTermAggregationFacetStateToQuery(
                query,
                "distributions.format.keyword",
                formState.facetFormat,
                "nested"
            ),
        aggregationApplicationFn: (query) => {
            return {
                ...query,
                bodyBuilder: query.bodyBuilder.aggregation(
                    "nested",
                    { path: "distributions" },
                    "facetFormat",
                    (a) => {
                        return a.aggregation(
                            "terms",
                            "distributions.format.keyword",
                            "_nestedAgg_facetFormat",
                            { size: 10000 }
                        );
                    }
                ),
            };
        },
        aggregationExtractFn: (agg: any) => agg._nestedAgg_facetFormat.buckets,
    },
];

export default function ExploreKnowledgeData() {
    const router = useRouter();

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const formState = useMemo<FormState>(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
            facetPublisher = [],
            facetFormat = [],
        } = router.query as QueryParameters;

        return {
            // Pagination
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,

            // String search query
            searchQuery,

            // Facets
            facetPublisher: normaliseAsReadonlyStringArray(facetPublisher),
            facetFormat: normaliseAsReadonlyStringArray(facetFormat),
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

    // Facets
    const esFacetRoot = useEsFacetRoot<FormState, EsDatasetKN>(
        formState,
        updateFormState,
        {
            facets: FACETS,
            url: "https://knowledgenet.co/api/v0/es-query/datasets",
        }
    );

    const { totalNumberOfResults, queryInProgress, queryResult } = esFacetRoot;

    const searchQuery = useEsIndividualFacetFreeText(esFacetRoot, {
        id: "searchQuery",
        label: "Search",
        placeholder: "Search datasets...",
    });

    const facetPublisher = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetPublisher",
        label: "Publisher",
        placeholder: "Filter by publisher...",
        itemSortFn: itemSortKeyAlpha,
    });

    const facetFormat = useEsIndividualFacetArray(esFacetRoot, {
        id: "facetFormat",
        label: "Format",
        placeholder: "Filter by format...",
        itemSortFn: itemSortKeyAlpha,
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

    return (
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
                    {[facetPublisher, facetFormat].map((facet) => (
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
                        {queryResult?.hits.hits.map(({ _id, _source }) => (
                            <DatasetCard
                                data-testid="dataset-card"
                                key={_id}
                                datasetId={_source.identifier}
                                title={_source.title}
                                description={_source.description}
                                status="SUCCESS"
                                exploreDataType="knowledgeNetwork"
                                landingPageUrl={
                                    _source.landingPage ?? undefined
                                }
                                // TODO: Add modification date into ES index
                                // lastUpdated={lastUpdated}
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

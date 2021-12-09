import axios from "axios";
import bodybuilder from "bodybuilder";
import { SearchResponse } from "elasticsearch";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";
import { EsDataset } from "../interfaces/EsDataset";

export type MinimumFormState = { pageSize: number; pageStart: number };

export type QueryState = {
    bodyBuilder: bodybuilder.Bodybuilder;
    modified: boolean;
};

export interface EsFacetRootConfig<T> {
    /** Registered aggregations and function to apply the facet to a query */
    facets: readonly {
        id: keyof T;
        facetApplicationFn: (formState: T, query: QueryState) => QueryState;
        aggregationApplicationFn: (query: QueryState) => QueryState;
    }[];

    /** ES endpoint URL */
    url: string;
}

export interface EsIndividualFacetConfig<T> {
    // type: "number" | "string" | "array";
    id: keyof T;
    label: string;
    placeholder?: string;
}

export interface EsFacetRoot<T extends MinimumFormState, R> {
    formState: T;
    onFormStateChange: (formState: Partial<T>) => void;

    facets: EsFacetRootConfig<T>["facets"];
    aggregations:
        | Record<string, readonly EsAggregationBucket[] | undefined>
        | undefined;

    totalNumberOfResults: number;
    queryInProgress: boolean;
    queryResult: SearchResponse<R> | undefined;
}

export interface EsIndividualFacet<T> {
    id: keyof T;
    label: string;
    placeholder?: string;

    type: "array";
    items: readonly EsAggregationBucket[];
    selectedItems: readonly EsAggregationBucket[];
    onItemSelect: (item: EsAggregationBucket) => void;
    onItemRemoveByTag: (tag: unknown, i: number) => void;
}

export const useEsFacetRoot = <T extends MinimumFormState, R = EsDataset>(
    formState: T,
    onFormStateChange: (formState: Partial<T>) => void,
    config: EsFacetRootConfig<T>
): EsFacetRoot<T, R> => {
    // State for query result
    const [queryResult, setQueryResult] = useState<
        SearchResponse<R> | undefined
    >(undefined);
    const [queryInProgress, setQueryInProgress] = useState<boolean>(false);

    // State for aggregations (expected to be static across different queries)
    const [globalAggregations, setGlobalAggregations] = useState<
        Record<string, readonly EsAggregationBucket[] | undefined> | undefined
    >(undefined);

    const totalNumberOfResults = useMemo(() => {
        // We'll say that there are 0 results if no data is available
        if (queryResult === undefined) {
            return 0;
        }

        const total = queryResult.hits.total;

        // Older Elasticsearch had number for `total`?
        if (typeof total === "number") {
            return total;
        } else {
            return (total as any).value as number;
        }
    }, [queryResult]);

    const constructEsGlobalAggregationFetchQueryObject = useCallback(() => {
        // As the Elasticsearch query being built here is only for the fetching
        // of aggregation values, we don't care for the actual results, so the
        // pagination values are set to 0
        const bodyBuilder = bodybuilder().size(0).from(0);

        let queryState = { bodyBuilder, modified: false };

        for (const facet of config.facets) {
            // Apply aggregations
            queryState = facet.aggregationApplicationFn(queryState);
        }

        // NOTE: The `modified` property of `queryState` is not used for this
        // because only aggregations have been applied, not query terms
        return queryState.bodyBuilder.query("match_all").build();
    }, [config.facets]);

    const constructEsQueryObject = useCallback(
        (pageSize: number, pageStart: number) => {
            const bodyBuilder = bodybuilder().size(pageSize).from(pageStart);

            let queryState = { bodyBuilder, modified: false };

            for (const facet of config.facets) {
                // Apply facet to query
                queryState = facet.facetApplicationFn(formState, queryState);
            }

            // If no query terms were applied, then search for everything
            if (!queryState.modified) {
                queryState = {
                    bodyBuilder: queryState.bodyBuilder.query("match_all"),
                    modified: true,
                };
            }

            return queryState.bodyBuilder.build();
        },
        [formState, config.facets]
    );

    useEffect(function executeGlobalAggregationsFetch() {
        const esQueryCancelToken = axios.CancelToken.source();

        (async () => {
            try {
                // Call Elasticsearch
                const query = constructEsGlobalAggregationFetchQueryObject();
                const { data } = await axios.post<SearchResponse<R>>(
                    config.url,
                    query,
                    {
                        // TODO: Implement headers for auth-required search
                        cancelToken: esQueryCancelToken.token,
                    }
                );

                const rawAggregations = data?.aggregations ?? {};

                // Map out aggregations to what we want
                const aggregationsRecords: Record<
                    string,
                    EsAggregationBucket[]
                > = Object.fromEntries(
                    Object.entries(rawAggregations).map(
                        ([aggName, aggResult]) => [
                            aggName,
                            (aggResult as any).buckets,
                        ]
                    )
                );

                setGlobalAggregations(aggregationsRecords);
            } catch (e) {
                // Ignore cancellation events
                if (axios.isCancel(e)) {
                    return;
                }

                console.error(e);

                alert(e.toString());
            }
        })();

        return function stopGlobalAggregationsFetch() {
            // Cancel the ES query if it is still running
            esQueryCancelToken.cancel();
        };
    }, []);

    useEffect(
        function executeEsQueryOnFormStateChange() {
            const esQueryCancelToken = axios.CancelToken.source();

            (async () => {
                setQueryInProgress(true);

                try {
                    // Call Elasticsearch
                    const query = constructEsQueryObject(
                        formState.pageSize,
                        formState.pageStart
                    );
                    const { data } = await axios.post<SearchResponse<R>>(
                        config.url,
                        query,
                        {
                            // TODO: Implement headers for auth-required search
                            cancelToken: esQueryCancelToken.token,
                        }
                    );

                    setQueryResult(data);
                } catch (e) {
                    // Ignore cancellation events
                    if (axios.isCancel(e)) {
                        return;
                    }

                    console.error(e);

                    alert(e.toString());
                } finally {
                    setQueryInProgress(false);
                }
            })();

            return function stopOngoingEsQuery() {
                // Cancel the ES query if it is still running
                esQueryCancelToken.cancel();
            };
        },
        [formState, constructEsQueryObject]
    );

    return {
        formState,
        onFormStateChange,

        facets: config.facets,
        aggregations: globalAggregations,

        totalNumberOfResults,
        queryInProgress,
        queryResult,
    };
};

export const useEsIndividualFacet = <T extends MinimumFormState>(
    // FIXME: Fix generic constraints for EsFacetRoot
    esFacetRoot: EsFacetRoot<T, any>,
    config: EsIndividualFacetConfig<T>
): EsIndividualFacet<T> => {
    // useEffect(
    //     function checkIfFacetRegistered() {
    //         if (!esFacetRoot.facets.some((x) => x.id === config.id)) {
    //             throw new Error(
    //                 "Facet must first be registered with root before use"
    //             );
    //         }
    //     },
    //     [esFacetRoot.facets, config.id]
    // );

    const selectedStringItems = useMemo(
        () => esFacetRoot.formState[config.id] as unknown as readonly string[],
        [esFacetRoot.formState[config.id]]
    );

    const items = useMemo(
        () => esFacetRoot?.aggregations?.[config.id as string] ?? [],
        [esFacetRoot?.aggregations?.[config.id as string]]
    );

    const selectedItems = useMemo(
        () => selectedStringItems.map((x) => items?.find((i) => x === i.key)!),
        [items, selectedStringItems]
    );

    const handleItemSelect = useCallback(
        (newItem: EsAggregationBucket) => {
            let newFormValue: string[];

            // If already present, remove
            const itemIndex = selectedStringItems.findIndex(
                (prevItem) => prevItem === newItem.key
            );

            if (itemIndex >= 0) {
                const arrayCopy = [...selectedStringItems];
                arrayCopy.splice(itemIndex, 1);
                newFormValue = arrayCopy;
            } else {
                // Otherwise append
                newFormValue = [...selectedStringItems, newItem.key];
            }

            esFacetRoot.onFormStateChange({
                [config.id]: newFormValue,
            } as unknown as Partial<T>);
        },
        [selectedStringItems, config.id, esFacetRoot.onFormStateChange]
    );

    const handleItemRemoveByTag = useCallback(
        (_tag: unknown, i: number) => {
            const arrayCopy = [...selectedStringItems];
            arrayCopy.splice(i, 1);
            const newFormValue = arrayCopy;

            esFacetRoot.onFormStateChange({
                [config.id]: newFormValue,
            } as unknown as Partial<T>);
        },
        [selectedStringItems, config.id, esFacetRoot.onFormStateChange]
    );

    return {
        id: config.id,
        label: config.label,
        placeholder: config.placeholder,

        type: "array",
        items,
        selectedItems,
        onItemSelect: handleItemSelect,
        onItemRemoveByTag: handleItemRemoveByTag,
    };
};

import axios from "axios";
import bodybuilder from "bodybuilder";
import { SearchResponse } from "elasticsearch";
import {
    ChangeEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";
import { EsDataset } from "../interfaces/EsDataset";
import { useKeycloakInfo } from "../util/keycloak";

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
        aggregationApplicationFn?: (query: QueryState) => QueryState;
        aggregationExtractFn?: (
            aggregation: unknown
        ) => readonly EsAggregationBucket[] | undefined;
    }[];

    /** ES endpoint URL */
    url: string;
}

export interface EsIndividualFacetConfig<T> {
    id: keyof T;
    label: string;
    placeholder?: string;
}

export interface EsIndividualFacetNumberRangeConfig<T> {
    minId: keyof T;
    maxId: keyof T;
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

export type EsIndividualFacet<T> =
    | EsIndividualFacetFreeText<T>
    | EsIndividualFacetArray<T>
    | EsIndividualFacetFixedArray<T>
    | EsIndividualFacetNumberRange<T>;

export interface EsIndividualFacetFreeText<T> {
    id: keyof T;
    label: string;
    placeholder?: string;

    type: "free-text";
    value: string;
    onValueChange: (value: string) => void;
    onInputFieldChange: ChangeEventHandler<HTMLInputElement>;
}

export interface EsIndividualFacetArray<T> {
    id: keyof T;
    label: string;
    placeholder?: string;

    type: "array";
    items: readonly EsAggregationBucket[];
    selectedItems: readonly (EsAggregationBucket | undefined)[];
    itemSortFn?: (
        a: EsAggregationBucket | undefined,
        b: EsAggregationBucket | undefined
    ) => number;
    onItemSelect: (item: EsAggregationBucket) => void;
    onItemRemoveByTag: (tag: unknown, i: number) => void;
}

export interface EsIndividualFacetFixedArray<T> {
    id: keyof T;
    label: string;
    placeholder?: string;

    type: "fixed-array";
    items: readonly { key: string; label: string; disabled?: boolean }[];
    selectedItems: readonly ({ key: string; label: string } | undefined)[];

    onItemSelect: (item: readonly { key: string; label: string }[]) => void;
}

export interface EsIndividualFacetNumberRange<T> {
    minId: keyof T;
    maxId: keyof T;
    label: string;
    placeholder?: string;

    type: "number-range";
    minValue: number;
    maxValue: number;
    onRangeChange: (min: number, max: number) => void;
}

export const useEsFacetRoot = <T extends MinimumFormState, R = EsDataset>(
    formState: T,
    onFormStateChange: (formState: Partial<T>) => void,
    config: EsFacetRootConfig<T>
): EsFacetRoot<T, R> => {
    const { keycloak } = useKeycloakInfo();
    const keycloakToken = keycloak?.token;

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
        const bodyBuilder = bodybuilder().size(0).from(0).rawOption("track_total_hits",true);

        let queryState = { bodyBuilder, modified: false };

        for (const facet of config.facets) {
            if (facet.aggregationApplicationFn !== undefined) {
                // Apply aggregations
                queryState = facet.aggregationApplicationFn(queryState);
            }
        }

        // NOTE: The `modified` property of `queryState` is not used for this
        // because only aggregations have been applied, not query terms
        return queryState.bodyBuilder.query("match_all").build();
    }, [config.facets]);

    const constructEsQueryObject = useCallback(() => {
        const { pageSize, pageStart } = formState;

        const bodyBuilder = bodybuilder().size(pageSize).from(pageStart).rawOption("track_total_hits",true);

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
    }, [formState, config.facets]);

    useEffect(
        function executeGlobalAggregationsFetch() {
            const esQueryCancelToken = axios.CancelToken.source();

            (async () => {
                try {
                    // Call Elasticsearch
                    const query =
                        constructEsGlobalAggregationFetchQueryObject();

                    // `Authorization` header depends on whether token is available
                    const headers: Record<string, string> = {};

                    if (keycloakToken && keycloakToken.length > 0) {
                        headers["Authorization"] = `Bearer ${keycloakToken}`;
                    }

                    const { data } = await axios.post<SearchResponse<R>>(
                        config.url,
                        query,
                        {
                            headers,
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
                            ([aggName, aggResult]) => {
                                // Look up if there is special mapping function
                                // for this aggregation
                                const extractFn = config.facets.find(
                                    (x) => x.id === aggName
                                )?.aggregationExtractFn;

                                if (extractFn !== undefined) {
                                    return [aggName, extractFn(aggResult)];
                                }

                                return [aggName, (aggResult as any).buckets];
                            }
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
        },
        [
            keycloakToken,
            constructEsGlobalAggregationFetchQueryObject,
            config.url,
            config.facets,
        ]
    );

    useEffect(
        function executeEsQueryOnFormStateChange() {
            const esQueryCancelToken = axios.CancelToken.source();

            (async () => {
                setQueryInProgress(true);

                try {
                    // Call Elasticsearch
                    const query = constructEsQueryObject();

                    // `Authorization` header depends on whether token is available
                    const headers: Record<string, string> = {};

                    if (keycloakToken && keycloakToken.length > 0) {
                        headers["Authorization"] = `Bearer ${keycloakToken}`;
                    }

                    const { data } = await axios.post<SearchResponse<R>>(
                        config.url,
                        query,
                        {
                            headers,
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
        [keycloakToken, constructEsQueryObject]
    );

    useEffect(
        function resetPageIndexIfOutOfBounds() {
            if (
                formState.pageStart !== 0 &&
                totalNumberOfResults < formState.pageStart
            ) {
                onFormStateChange({
                    pageStart: 0,
                } as Partial<T>);
            }
        },
        // NOTE: We only want to evaluate this effect when the query result
        // changes, not every time one of the page parameters change, hence
        // why we don't put everything that could possibly change in the
        // dependency array below
        [totalNumberOfResults, queryResult]
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

export const useEsIndividualFacetFreeText = <T extends MinimumFormState>(
    // FIXME: Fix generic constraints for EsFacetRoot
    esFacetRoot: EsFacetRoot<T, any>,
    config: EsIndividualFacetConfig<T>
): EsIndividualFacetFreeText<T> => {
    const value = useMemo(
        () => esFacetRoot.formState[config.id] as unknown as string,
        [esFacetRoot.formState[config.id]]
    );

    const handleValueChange = useCallback(
        (newValue: string) => {
            esFacetRoot.onFormStateChange({
                [config.id]: newValue,
            } as unknown as Partial<T>);
        },
        [config.id, esFacetRoot.onFormStateChange]
    );

    const handleInputFieldChange = useCallback<
        ChangeEventHandler<HTMLInputElement>
    >(
        (e) => {
            e.preventDefault();
            handleValueChange(e.currentTarget.value);
        },
        [handleValueChange]
    );

    return {
        id: config.id,
        label: config.label,
        placeholder: config.placeholder,

        type: "free-text",
        value,
        onValueChange: handleValueChange,
        onInputFieldChange: handleInputFieldChange,
    };
};

export const useEsIndividualFacetArray = <T extends MinimumFormState>(
    // FIXME: Fix generic constraints for EsFacetRoot
    esFacetRoot: EsFacetRoot<T, any>,
    config: EsIndividualFacetConfig<T> & {
        itemSortFn?: (
            a: EsAggregationBucket | undefined,
            b: EsAggregationBucket | undefined
        ) => number;
    }
): EsIndividualFacetArray<T> => {
    const selectedStringItems = useMemo(
        () => esFacetRoot.formState[config.id] as unknown as readonly string[],
        [esFacetRoot.formState[config.id]]
    );

    const items = useMemo(
        () => esFacetRoot?.aggregations?.[config.id as string] ?? [],
        [esFacetRoot?.aggregations?.[config.id as string]]
    );

    const selectedItems = useMemo(
        () => selectedStringItems.map((x) => items?.find((i) => x === i.key)),
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
        itemSortFn: config.itemSortFn,
        onItemSelect: handleItemSelect,
        onItemRemoveByTag: handleItemRemoveByTag,
    };
};

export const useEsIndividualFacetFixedArray = <T extends MinimumFormState>(
    // FIXME: Fix generic constraints for EsFacetRoot
    esFacetRoot: EsFacetRoot<T, any>,
    config: EsIndividualFacetConfig<T> & {
        items: readonly { key: string; label: string; disabled?: boolean }[];
        mapFromState: (
            allItems: readonly { key: string; label: string }[],
            itemKeys: readonly string[]
        ) => readonly ({ key: string; label: string } | undefined)[];
        mapToState: (
            items: readonly { key: string; label: string }[]
        ) => readonly string[];
    }
): EsIndividualFacetFixedArray<T> => {
    const selectedItems = useMemo(() => {
        const itemKeys = esFacetRoot.formState[
            config.id
        ] as unknown as readonly string[];
        return config.mapFromState(config.items, itemKeys);
    }, [config.items, config.mapFromState, esFacetRoot.formState]);

    const handleItemSelect = useCallback(
        (newItems: readonly { key: string; label: string }[]) => {
            esFacetRoot.onFormStateChange({
                [config.id]: config.mapToState(newItems),
            } as unknown as Partial<T>);
        },
        [config.id, config.mapToState, esFacetRoot.onFormStateChange]
    );

    return {
        id: config.id,
        label: config.label,
        placeholder: config.placeholder,

        type: "fixed-array",
        items: config.items,
        selectedItems,
        onItemSelect: handleItemSelect,
    };
};

export const useEsIndividualFacetNumberRange = <T extends MinimumFormState>(
    esFacetRoot: EsFacetRoot<T, any>,
    config: EsIndividualFacetNumberRangeConfig<T>
): EsIndividualFacetNumberRange<T> => {
    const minValue = useMemo(
        () => esFacetRoot.formState[config.minId] as unknown as number,
        [esFacetRoot.formState[config.minId]]
    );

    const maxValue = useMemo(
        () => esFacetRoot.formState[config.maxId] as unknown as number,
        [esFacetRoot.formState[config.maxId]]
    );

    const handleRangeChange = useCallback(
        (min: number, max: number) => {
            esFacetRoot.onFormStateChange({
                [config.minId]: min,
                [config.maxId]: max,
            } as unknown as Partial<T>);
        },
        [config.minId, config.maxId, esFacetRoot.onFormStateChange]
    );

    return {
        minId: config.minId,
        maxId: config.maxId,
        label: config.label,
        placeholder: config.placeholder,

        type: "number-range",
        minValue,
        maxValue,
        onRangeChange: handleRangeChange,
    };
};

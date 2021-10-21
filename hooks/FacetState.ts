import { useCallback, useEffect, useMemo, useState } from "react";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";

/**
 * @param rawItems Value of the `bucket` in Elasticsearch aggregations
 */
export function useFacetState<T extends EsAggregationBucket>(
    rawItems: readonly T[] | undefined
) {

    const [selectedItems, setSelectedItems] = useState<readonly T[]>([]);

    const memoedItems = useMemo(() => rawItems || [], [rawItems]);
    console.log('memoedItems', memoedItems)
    const selectedItemKeyHash = useMemo(
        () => selectedItems.reduce((c, x) => c + x.key, ""),
        [selectedItems]
    );
    console.log('selectedItems keyHash', selectedItems, selectedItemKeyHash)
    const handleItemSelect = useCallback((newItem: T) => {
        setSelectedItems((prevSelectedItems) => {
            console.log('setSelectedItems start', prevSelectedItems, newItem)
            // If already present, remove
            const itemIndex = prevSelectedItems.findIndex(
                (prevItem) => prevItem.key === newItem.key
            );

            if (itemIndex >= 0) {
                const arrayCopy = [...prevSelectedItems];
                arrayCopy.splice(itemIndex, 1);
                return arrayCopy;
            }
            console.log('setSelectedItems end', prevSelectedItems, newItem)
            // Otherwise append
            return [...prevSelectedItems, newItem];
        });
    }, []);

    const handleItemRemoveByTag = useCallback(
        (_tag, i) =>
            setSelectedItems((prevSelectedItems) => {
                console.log('handleItemRemoveByTag', prevSelectedItems)
                const arrayCopy = [...prevSelectedItems];
                arrayCopy.splice(i, 1);
                return arrayCopy;
            }),
        []
    );

    const getQueryParams = useCallback(() => {
        // Return empty string for empty selections
        if (selectedItems.length === 0) {
            return "";
        }

        // Otherwise return array of _keys_
        return selectedItems.map((x) => x.key);
    }, [selectedItems]);

    // Reconcile selected items array when the `items` array changes
    useEffect(
        function reconcileSelectedItemsOnItemsChange() {
            // If no items available, wipe everything
            if (rawItems === undefined) {
                setSelectedItems([]);
                return;
            }

            // Filter through selected items array and keep only if they exist
            // in the new `items` array
            setSelectedItems((prevSelectedItems) =>
                prevSelectedItems.filter((prevItem) =>
                    rawItems.some((item) => item.key === prevItem.key)
                )
            );
        },
        [rawItems]
    );
    
    // console.log('FacetState', {
    //     items: memoedItems,
    //     selectedItems,
    //     selectedItemKeyHash,
    //     getQueryParams,
    //     setSelectedItems,
    //     handleItemSelect,
    //     handleItemRemoveByTag,
    // })
    return {
        items: memoedItems,
        selectedItems,
        selectedItemKeyHash,
        getQueryParams,
        setSelectedItems,
        handleItemSelect,
        handleItemRemoveByTag,
    };
}

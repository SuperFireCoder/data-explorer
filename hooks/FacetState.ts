import { useCallback, useEffect, useMemo, useState } from "react";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";

/**
 * @param rawItems Value of the `bucket` in Elasticsearch aggregations
 * @param selectedItems Selected items
 */
export function useFacetState<T extends EsAggregationBucket>(
    rawItems: readonly T[] | undefined,
    selectedItems: readonly string[],
    onSelectedItemsChange: (items: string[]) => void,
) {

    // const [selectedItems, setSelectedItems] = useState<readonly T[]>(initialSelectedItems);
    // console.log('useFacetState', rawItems, selectedItems);
    // Selected items mapped to Elasticsearch raw items
    const esSelectedItems = useMemo(() => 
        selectedItems
            .map(key => (rawItems ?? []).find(x => x.key === key))
            .filter(x => x !== undefined) as readonly T[]
    , [rawItems, selectedItems]);

    const memoedItems = useMemo(() => rawItems || [], [rawItems]);

    const selectedItemKeyHash = useMemo(
        () => selectedItems.reduce((c, x) => c + x, ""),
        [selectedItems]
    );
 
    const handleItemSelect = useCallback((newItem: T) => {
        
        //TO  REVIEW: prevSelectionItems?
            // console.log('setSelectedItems start', prevSelectedItems, newItem)
            // If already present, remove
            const itemIndex = selectedItems.findIndex(
                (prevItem) => prevItem === newItem.key
            );

            if (itemIndex >= 0) {
                const arrayCopy = [...selectedItems];
                arrayCopy.splice(itemIndex, 1);
                return onSelectedItemsChange(arrayCopy);
            }
            // console.log('setSelectedItems end', prevSelectedItems, newItem)
            // Otherwise append
            return onSelectedItemsChange([...selectedItems, newItem.key]);

        
    }, [selectedItems, onSelectedItemsChange]);

    const handleItemRemoveByTag = useCallback(
        (_tag, i) => {

                // console.log('handleItemRemoveByTag', prevSelectedItems)
                const arrayCopy = [...selectedItems];
                arrayCopy.splice(i, 1);
                return onSelectedItemsChange(arrayCopy);
        },
        [selectedItems, onSelectedItemsChange]
    );

    const getQueryParams = useCallback(() => {
        // Return empty string for empty selections
        if (selectedItems.length === 0) {
            return "";
        }

        // Otherwise return array of _keys_
        // return selectedItems.map((x) => x.key);

        // TODO: Remove this function at a later date due to this being
        // redundant
        return [];
    }, [selectedItems]);

    // // Reconcile selected items array when the `items` array changes
    // useEffect(
    //     function reconcileSelectedItemsOnItemsChange() {
    //         // If no items available, wipe everything
    //         if (rawItems === undefined) {
    //             setSelectedItems([]);
    //             return;
    //         }

    //         // Filter through selected items array and keep only if they exist
    //         // in the new `items` array
    //         setSelectedItems((prevSelectedItems) =>
    //             prevSelectedItems.filter((prevItem) =>
    //                 rawItems.some((item) => item.key === prevItem.key)
    //             )
    //         );
    //     },
    //     [rawItems]
    // );
   
    return {
        items: memoedItems,
        selectedItems,
        esSelectedItems,
        selectedItemKeyHash,
        getQueryParams,
        // setSelectedItems,
        handleItemSelect,
        handleItemRemoveByTag,
    };
}

import { MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, MultiSelect } from "@blueprintjs/select";
import { ReactNode, SyntheticEvent, useCallback, useMemo } from "react";

import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";

export interface Props<T> {
    items: readonly T[];
    selectedItems: readonly T[];
    placeholder?: string;
    onItemSelect: (item: T, event?: SyntheticEvent<HTMLElement>) => void;
    onItemRemoveByTag: (tag: ReactNode, index: number) => void;
    tagRenderer?: (item: T) => ReactNode;
    itemEqualityFn?: (a: T, b: T) => boolean;
}

const defaultItemEqualityFn = (
    a: EsAggregationBucket,
    b: EsAggregationBucket
) => a.key === b.key;

const defaultItemPredicateFilter: ItemPredicate<EsAggregationBucket> = (
    query,
    item,
    _index,
    exactMatch
) =>
    exactMatch
        ? item.key === query
        : item.key.toLowerCase().indexOf(query.toLowerCase()) >= 0;

const defaultTagRenderer = (item: EsAggregationBucket) => item.key;

export default function FacetMultiSelect<T extends EsAggregationBucket>({
    items,
    selectedItems,
    placeholder,
    onItemSelect,
    onItemRemoveByTag,
    tagRenderer = defaultTagRenderer,
    itemEqualityFn = defaultItemEqualityFn,
}: Props<T>) {
 
    const tagInputProps = useMemo(
        () => ({
            onRemove: onItemRemoveByTag,
            dataTestid: "facet-multi-select-tag-input",
        }),
        [onItemRemoveByTag]
    );

    const isItemInSelectedItems = useCallback(
        (item: T) => {
            return selectedItems.some((selectedItem) =>
                itemEqualityFn(selectedItem, item)
            );
        },
        [selectedItems, itemEqualityFn]
    );

    const menuItemRenderer = useCallback<ItemRenderer<T>>(
        (item, { modifiers, handleClick }) => {
            // Filter out items which don't match the query in the box
            if (!modifiers.matchesPredicate) {
                return null;
            }

            return (
                <MenuItem
                    key={item.key}
                    icon={isItemInSelectedItems(item) ? "tick" : "blank"}
                    active={modifiers.active}
                    onClick={handleClick}
                    text={item.key}
                    label={`${item.doc_count}`}
                    // Keep select menu list open after selection
                    shouldDismissPopover={false}
                />
            );
        },
        [isItemInSelectedItems]
    );

    return (
        <MultiSelect<T>
            // NOTE: Marking array as mutable for type compatibility only
            items={items as T[]}
            selectedItems={selectedItems as T[]}
            itemRenderer={menuItemRenderer}
            itemPredicate={defaultItemPredicateFilter}
            onItemSelect={onItemSelect}
            tagRenderer={tagRenderer}
            tagInputProps={tagInputProps}
            noResults={<MenuItem disabled text="No options available" />}
            resetOnSelect={false}
            resetOnQuery={false}
            placeholder={placeholder}
            fill
        />
    );
}

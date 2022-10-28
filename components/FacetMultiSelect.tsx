import { MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, MultiSelect } from "@blueprintjs/select";
import { ReactNode, SyntheticEvent, useCallback, useMemo } from "react";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";
import styles from "./FacetMultiSelect.module.css";

export interface Props<T> {
    items: readonly T[];
    selectedItems: readonly (T | undefined)[];
    placeholder?: string;
    onItemSelect: (item: T, event?: SyntheticEvent<HTMLElement>) => void;
    onItemRemoveByTag: (tag: ReactNode, index: number) => void;
    tagRenderer?: (item: T) => ReactNode;
    itemEqualityFn?: (a: T | undefined, b: T | undefined) => boolean;
    itemSortFn?: (a: T | undefined, b: T | undefined) => number;
    /** Whether to disable rendering of the document count label for items */
    disableDocCountLabel?: boolean;
}

const defaultItemEqualityFn = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => !!(a && b) && a.key === b.key;

const defaultItemPredicateFilter: ItemPredicate<EsAggregationBucket> = (
    query,
    item,
    _index,
    exactMatch
) =>
    exactMatch
        ? item.key === query
        : item.key.toLowerCase().indexOf(query.toLowerCase()) >= 0;

const defaultTagRenderer = (item: EsAggregationBucket | undefined) =>
    item?.key ?? "";

export const itemSortKeyAlpha = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => (a?.key ?? "").localeCompare(b?.key ?? "");

export const itemSortCountDesc = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => {
    const aCount = a?.doc_count ?? 0;
    const bCount = b?.doc_count ?? 0;

    if (aCount < bCount) {
        return -1;
    }

    if (aCount > bCount) {
        return 1;
    }

    return 0;
};

export default function FacetMultiSelect<T extends EsAggregationBucket>({
    items,
    selectedItems,
    placeholder,
    onItemSelect,
    onItemRemoveByTag,
    tagRenderer = defaultTagRenderer,
    itemEqualityFn = defaultItemEqualityFn,
    itemSortFn,
    disableDocCountLabel = false,
}: Props<T>) {
 
    const tagInputProps = useMemo(
        () => ({
            onRemove: onItemRemoveByTag,
            dataTestid: "facet-multi-select-tag-input",
        }),
        [onItemRemoveByTag]
    );

    const sortedItems = useMemo(
        () => (itemSortFn === undefined ? items : [...items].sort(itemSortFn)),
        [items, itemSortFn]
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
                    // disable labels as they dont always truly reflect the correct number
                    // label={
                    //     disableDocCountLabel ? undefined : `${item.doc_count}`
                    // }
                    // Keep select menu list open after selection
                    shouldDismissPopover={false}
                />
            );
        },
        [isItemInSelectedItems, disableDocCountLabel]
    );

    return (
        <MultiSelect<T>
            // NOTE: Marking array as mutable for type compatibility only
            items={sortedItems as T[]}
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
            popoverProps={{ popoverClassName: styles.selectOptionsMenu }}
        />
    );
}

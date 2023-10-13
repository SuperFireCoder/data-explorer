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
    itemLabels?: Record<string, string>;
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

export const itemSortKeyAlpha = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => (a?.key ?? "").localeCompare(b?.key ?? "");

export const monthItemSort = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => {
    const monthLabelToNumberMap: { [key: string]: number } = {
        "Non monthly data": 0,
        "January": 1,
        "February": 2,
        "March": 3,
        "April": 4,
        "May": 5,
        "June": 6,
        "July": 7,
        "August": 8,
        "September": 9,
        "October": 10,
        "November": 11,
        "December": 12,
    };

    return (monthLabelToNumberMap[a?.key as string] ?? 0)
    - (monthLabelToNumberMap[b?.key as string] ?? 0);
}

export const resolutionItemSort = (
    a: EsAggregationBucket | undefined,
    b: EsAggregationBucket | undefined
) => {
    const aName = a?.key;
    const bName = b?.key;

    if (aName === undefined || bName === undefined) {
        return 0;
    }

    // Parse "arcmin"/"arcsec" names
    const parseArcSecValueFromName = (x: string) => {
        const parts = x
            .split(" ")
            .filter((s) => s.trim().length !== 0)
            .map((s) => s.toLowerCase());

        // Assume first is number, second is unit
        // e.g. "36 arcsec (...)"
        if (parts[1] === "arcsec") {
            return Number.parseFloat(parts[0]);
        }

        if (parts[1] === "arcmin") {
            return Number.parseFloat(parts[0]) * 60;
        }

        // Return NaN if we don't know what we're dealing with rather
        // than throwing as we don't want to completely crash the sort
        return Number.NaN;
    };

    const aValue = parseArcSecValueFromName(aName);
    const bValue = parseArcSecValueFromName(bName);

    if (aValue < bValue) {
        return -1;
    }

    if (aValue > bValue) {
        return 1;
    }

    return 0;
};

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
    tagRenderer,
    itemEqualityFn = defaultItemEqualityFn,
    itemSortFn,
    itemLabels,
    disableDocCountLabel = false,
}: Props<T>) {

    const defaultTagRenderer = (item: EsAggregationBucket | undefined) => {
        if (item?.key === undefined){
            return "";
        }
        // custom label
        if (itemLabels?.[item.key] !== undefined){
            return itemLabels[item.key]
        }
        return item.key;
    }

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
                    text={defaultTagRenderer(item)}
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
            tagRenderer={tagRenderer ?? defaultTagRenderer}
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

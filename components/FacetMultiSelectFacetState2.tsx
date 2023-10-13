import { EsIndividualFacetArray } from "../hooks/EsFacet";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";
import FacetMultiSelect from "./FacetMultiSelect";

export interface Props<T> {
    facet: EsIndividualFacetArray<T>;
    disableDocCountLabel?: boolean;
}

export default function FacetMultiSelectFacetState2<T>({
    facet,
    disableDocCountLabel,
}: Props<T>) {

    let {
        items = [],
        selectedItems = [],
        itemSortFn,
        itemLabels,
        onItemSelect,
        onItemRemoveByTag,
        placeholder,
    } = facet;

    return (
        <FacetMultiSelect
            items={items}
            selectedItems={selectedItems}
            placeholder={placeholder}
            onItemSelect={onItemSelect}
            onItemRemoveByTag={onItemRemoveByTag}
            disableDocCountLabel={disableDocCountLabel}
            itemSortFn={itemSortFn}
            itemLabels={itemLabels}
        />
    );
}

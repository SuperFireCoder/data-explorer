import { EsIndividualFacetArray } from "../hooks/EsFacet";
import { EsAggregationBucket } from "../interfaces/EsAggregationBucket";
import FacetMultiSelect from "./FacetMultiSelect";

export interface Props<T> {
    facet: EsIndividualFacetArray<T>;
    disableDocCountLabel?: boolean;
}

export const OLD_TIME_DOMAIN_VAL ="Current"
export const NEW_TIME_DOMAIN_VAL ="Current/Historic"

export default function FacetMultiSelectFacetState2<T>({
    facet,
    disableDocCountLabel,
}: Props<T>) {

    let {
        items = [],
        selectedItems = [],
        itemSortFn,
        onItemSelect,
        onItemRemoveByTag,
        placeholder,
    } = facet;

    if (facet.id === "facetTimeDomain") {
        let timeDomainItems: EsAggregationBucket[] = []
        items.forEach(item => {
            if (item.key === OLD_TIME_DOMAIN_VAL) {
                item.key = NEW_TIME_DOMAIN_VAL
            }
            timeDomainItems.push(item)
            items = timeDomainItems
        })
    }

    return (
        <FacetMultiSelect
            items={items}
            selectedItems={selectedItems}
            placeholder={placeholder}
            onItemSelect={onItemSelect}
            onItemRemoveByTag={onItemRemoveByTag}
            disableDocCountLabel={disableDocCountLabel}
            itemSortFn={itemSortFn}
        />
    );
}

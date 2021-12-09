import { EsIndividualFacet } from "../hooks/EsFacet";
import FacetMultiSelect from "./FacetMultiSelect";

export interface Props<T> {
    facet: EsIndividualFacet<T>;
}

export default function FacetMultiSelectFacetState2<T>({ facet }: Props<T>) {
    const {
        items = [],
        selectedItems = [],
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
        />
    );
}

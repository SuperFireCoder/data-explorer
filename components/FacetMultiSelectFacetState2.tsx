import { useEsIndividualFacet } from "../hooks/EsFacet";
import FacetMultiSelect from "./FacetMultiSelect";

export interface Props {
    facet: ReturnType<typeof useEsIndividualFacet>;
}

export default function FacetMultiSelectFacetState2({ facet }: Props) {
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

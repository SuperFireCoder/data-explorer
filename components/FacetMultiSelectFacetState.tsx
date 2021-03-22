import { useFacetState } from "../hooks/FacetState";
import FacetMultiSelect from "./FacetMultiSelect";

export interface Props {
    facetState: ReturnType<typeof useFacetState>;
    placeholder?: string;
}

export default function FacetMultiSelectFacetState({
    facetState,
    placeholder,
}: Props) {
    const {
        items,
        selectedItems,
        handleItemSelect,
        handleItemRemoveByTag,
    } = facetState;

    return (
        <FacetMultiSelect
            items={items}
            selectedItems={selectedItems}
            placeholder={placeholder}
            onItemSelect={handleItemSelect}
            onItemRemoveByTag={handleItemRemoveByTag}
        />
    );
}

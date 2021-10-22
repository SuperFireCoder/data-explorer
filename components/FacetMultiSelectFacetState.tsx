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
        esSelectedItems,
        handleItemSelect,
        handleItemRemoveByTag,
    } = facetState;
    //console.log('f state', selectedItems)

    //TO REVIEW: onItemSelect? 
    return (
        <FacetMultiSelect
            items={items}
            selectedItems={esSelectedItems}
            placeholder={placeholder}
            onItemSelect={handleItemSelect}
            onItemRemoveByTag={handleItemRemoveByTag}
        />
    );
}

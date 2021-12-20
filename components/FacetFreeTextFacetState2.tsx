import {
    HTMLInputProps,
    IInputGroupProps,
    InputGroup,
} from "@blueprintjs/core";
import {
    ChangeEventHandler,
    FormEventHandler,
    useCallback,
    useEffect,
    useState,
} from "react";
import { EsIndividualFacetFreeText } from "../hooks/EsFacet";

type InputGroupProps = IInputGroupProps & HTMLInputProps;

export interface Props<T> extends InputGroupProps {
    facet: EsIndividualFacetFreeText<T>;
}

export default function FacetFreeTextFacetState2<T>({
    facet,
    ...inputGroupProps
}: Props<T>) {
    const [fieldValue, setFieldValue] = useState<string>(facet.value);

    const handleFieldValueChange = useCallback<
        ChangeEventHandler<HTMLInputElement>
    >((e) => {
        setFieldValue(e.currentTarget.value);
    }, []);

    const handleFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault();
            e.stopPropagation();

            facet.onValueChange(fieldValue);
        },
        [facet.onValueChange, fieldValue]
    );

    useEffect(
        function syncFacetValueToFieldValue() {
            setFieldValue(facet.value);
        },
        [facet.value]
    );

    return (
        <form onSubmit={handleFormSubmit}>
            <InputGroup
                {...inputGroupProps}
                placeholder={facet.placeholder}
                value={fieldValue}
                onChange={handleFieldValueChange}
            />
        </form>
    );
}

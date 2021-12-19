import {
    HTMLInputProps,
    IInputGroupProps,
    InputGroup,
} from "@blueprintjs/core";
import {
    ChangeEventHandler,
    FocusEventHandler,
    KeyboardEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const numberToString = (x: number | null) => {
    if (x === null) {
        return "";
    }

    return x.toString();
};

export type Props = IInputGroupProps &
    HTMLInputProps & {
        numberParseMode: "integer" | "float";
        numberValue: number | null;
        onNumberValueChange: (newValue: number | null) => void;
        triggerChangeOnEnter?: boolean;
        triggerChangeOnTimeout?: number;
    };

/**
 * Component that parses input (on blur) into numbers.
 */
export default function NumberInputGroup({
    numberParseMode,
    numberValue,
    onNumberValueChange,
    triggerChangeOnEnter = true,
    triggerChangeOnTimeout = 1000,
    ...props
}: Props) {
    const changeTimeoutTimer = useRef<undefined | number>(undefined);

    const [inputGroupStringValue, setInputGroupStringValue] =
        useState<string>("");

    const parseNumber = useMemo(() => {
        switch (numberParseMode) {
            case "float":
                return (x: string) => {
                    const number = Number.parseFloat(x);

                    if (!Number.isFinite(number)) {
                        return null;
                    }

                    return number;
                };
            case "integer":
                return (x: string) => {
                    const number = Number.parseInt(x, 10);

                    if (!Number.isFinite(number)) {
                        return null;
                    }

                    return number;
                };
        }
    }, [numberParseMode]);

    const triggerChangeAndStateUpdate = useCallback(
        (rawValue: string) => {
            // Capture value from field and then parse
            const parsedNumber = parseNumber(rawValue);

            // Send up to parent and update internal state
            setInputGroupStringValue(numberToString(parsedNumber));
            onNumberValueChange?.(parsedNumber);
        },
        [parseNumber, onNumberValueChange]
    );

    const handleInputGroupChange = useCallback<
        ChangeEventHandler<HTMLInputElement>
    >(
        (e) => {
            // Copy across raw value to internal state so that the controlled
            // `value` permits all user input regardless of validity while typing
            const rawValue = e.currentTarget.value;
            setInputGroupStringValue(rawValue);

            // Clear any existing and (re)setup timeout trigger
            if (triggerChangeOnTimeout !== 0) {
                window.clearTimeout(changeTimeoutTimer.current);
                changeTimeoutTimer.current = window.setTimeout(() => {
                    triggerChangeAndStateUpdate(rawValue);
                }, triggerChangeOnTimeout);
            }
        },
        [triggerChangeAndStateUpdate, triggerChangeOnTimeout]
    );

    const handleInputGroupBlur = useCallback<
        FocusEventHandler<HTMLInputElement>
    >(
        (e) => {
            const rawValue = e.currentTarget.value;
            triggerChangeAndStateUpdate(rawValue);
        },
        [triggerChangeAndStateUpdate]
    );

    const handleInputGroupKeyDown = useCallback<
        KeyboardEventHandler<HTMLInputElement>
    >(
        (e) => {
            if (triggerChangeOnEnter && e.key === "Enter") {
                const rawValue = e.currentTarget.value;
                triggerChangeAndStateUpdate(rawValue);
                return;
            }
        },
        [triggerChangeAndStateUpdate, triggerChangeOnEnter]
    );

    useEffect(
        function syncInputGroupStringValueFromNumberValue() {
            // Convert number into string value and overwrite internal state
            setInputGroupStringValue(numberToString(numberValue));
        },
        [numberValue]
    );

    return (
        <InputGroup
            {...props}
            value={inputGroupStringValue}
            onChange={handleInputGroupChange}
            onBlur={handleInputGroupBlur}
            onKeyDown={handleInputGroupKeyDown}
        />
    );
}

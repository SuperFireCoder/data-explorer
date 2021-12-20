import { H6, InputGroup, Switch } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { ComponentProps, FormEventHandler, useCallback, useMemo } from "react";
import NumberInputGroup from "./NumberInputGroup";
import { EsIndividualFacetNumberRange } from "../hooks/EsFacet";

export interface Props<T> {
    facet: EsIndividualFacetNumberRange<T>;
    defaultMin: number;
    defaultMax: number;
    numberParseMode?: ComponentProps<
        typeof NumberInputGroup
    >["numberParseMode"];
}

export default function FacetNumberRangeFacetState2<T>({
    facet,
    defaultMin,
    defaultMax,
    numberParseMode = "float",
}: Props<T>) {
    const { minValue, maxValue, label, onRangeChange } = facet;

    const numberRangeIsAll = useMemo(
        () => Number.isNaN(minValue) && Number.isNaN(maxValue),
        [minValue, maxValue]
    );

    const handleNumberRangeIsAllChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(
        (e) => {
            // If we're wiping everything out (setting range to "all"), set both
            // numbers to NaN
            if (e.currentTarget.checked) {
                onRangeChange(Number.NaN, Number.NaN);
                return;
            }

            // Otherwise set default values
            onRangeChange(defaultMin, defaultMax);
        },
        [onRangeChange, defaultMin, defaultMax]
    );

    return (
        <div>
            <Row disableDefaultMargins>
                <Col xs={6}>
                    <H6>{label}</H6>
                </Col>
                <Col xs={6} style={{ textAlign: "right" }}>
                    <Switch
                        checked={numberRangeIsAll}
                        onChange={handleNumberRangeIsAllChange}
                        innerLabel="Range"
                        innerLabelChecked="All"
                        style={{ marginRight: "-10px" }}
                    />
                </Col>
            </Row>
            {!numberRangeIsAll && (
                <Row disableDefaultMargins gutterWidth={2}>
                    <Col xs={6}>
                        <NumberInputGroup
                            type="number"
                            numberParseMode={numberParseMode}
                            numberValue={minValue}
                            onNumberValueChange={(x) =>
                                onRangeChange(x ?? Number.NaN, maxValue)
                            }
                        />
                    </Col>
                    <Col xs={6}>
                        <NumberInputGroup
                            type="number"
                            numberParseMode={numberParseMode}
                            numberValue={maxValue}
                            onNumberValueChange={(x) =>
                                onRangeChange(minValue, x ?? Number.NaN)
                            }
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
}

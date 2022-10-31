import {
    H6,
    Icon,
    Popover,
    PopoverInteractionKind,
    Position,
    Switch,
    RangeSlider
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { FormEventHandler, useCallback, useMemo } from "react";
import { EsIndividualFacetNumberRange } from "../hooks/EsFacet";
import styles from "./FacetSelectFacetState2.module.css";

export interface Props<T> {
    facet: EsIndividualFacetNumberRange<T>;
    defaultMin: number;
    defaultMax: number;
}

export default function FacetNumberRangeFacetState2<T>({
    facet,
    defaultMin,
    defaultMax
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

    const monthNumberToLabelMap: { [key: number]: string } = {
        1: "January",
        2: "February",
        3: "March",
        4: "April",
        5: "May",
        6: "June",
        7: "July",
        8: "August",
        9: "September",
        10: "October",
        11: "November",
        12: "December"
    };

    return (
        <div>
            <Row disableDefaultMargins>
                <Col xs={6}>
                    <H6>
                        {label}&nbsp;
                        <Popover
                            position={Position.TOP_LEFT}
                            autoFocus={false}
                            interactionKind={PopoverInteractionKind.HOVER}
                            content={
                                <span className={styles.toolTip}>
                                    Select a range of{" "}
                                    {label.toLocaleLowerCase()}s by sliding all
                                    to range.
                                </span>
                            }
                        >
                            <a>
                                <Icon icon="info-sign" iconSize={15} />
                            </a>
                        </Popover>
                    </H6>
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
                <>
                    <RangeSlider
                        min={1}
                        max={12}
                        stepSize={1}
                        labelRenderer={(monthNumber) =>
                            monthNumberToLabelMap[monthNumber]
                        }
                        labelValues={[]}
                        onChange={(range) => onRangeChange(range[0], range[1])}
                        value={[minValue, maxValue]}
                        className={styles.rangeSlider}
                    />
                </>
            )}
        </div>
    );
}

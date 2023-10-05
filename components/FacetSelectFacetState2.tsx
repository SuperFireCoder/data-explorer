import { Button, Checkbox, H6, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { useCallback } from "react";
import { EsIndividualFacetFixedArray } from "../hooks/EsFacet";

import styles from "./FacetSelectFacetState2.module.css";

export interface Props<T> {
    facet: EsIndividualFacetFixedArray<T>;
    enabled?: boolean;
}

type Item = {
    key: string;
    label: string;
    disabled?: boolean | undefined;
};

export default function FacetSelectFacetState2<T>({
    facet,
    enabled=true
}: Props<T>) {
    const { items = [], selectedItems = [], onItemSelect, label } = facet;
    const handleSelectChange = useCallback(
        (item: Item) => {
            onItemSelect([item]);
        },
        [items, onItemSelect]
    );

    return (
        <>
            {items.length > 0 && (
                <div data-cy="show-datasets-div" >
                    <Row>
                        <Col>
                            <H6 data-cy="show-datasets-label">{label}</H6>

                            <Select
                                items={items as Item[]}
                                itemRenderer={(
                                    { key, label, disabled },
                                    { handleClick, modifiers }
                                ) => (
                                    <MenuItem
                                        key={key}
                                        disabled={disabled}
                                        onClick={handleClick}
                                        active={modifiers.active}
                                        text={label}
                                        data-cy="show-datasets-menuItem"
                                        data-testid={label}
                                    />
                                )}
                                onItemSelect={handleSelectChange}
                                filterable={false}
                                disabled={!enabled}
                            >
                                <Button
                                    className={styles.selectButton}
                                    fill
                                    rightIcon="caret-down"
                                    text={selectedItems[0]?.label}
                                    data-cy="show-datasets-button"
                                    disabled={!enabled}
                                />
                            </Select>
                        </Col>
                    </Row>
                </div>
            )}
        </>
    );
}

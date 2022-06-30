import { Button, H6, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { useCallback } from "react";
import { EsIndividualFacetFixedArray } from "../hooks/EsFacet";

import styles from "./FacetSelectFacetState2.module.css";

export interface Props<T> {
    facet: EsIndividualFacetFixedArray<T>;
}

type Item = {
    key: string;
    label: string;
    disabled?: boolean | undefined;
};

export default function FacetSelectFacetState2<T>({ facet }: Props<T>) {
    const { items = [], selectedItems = [], onItemSelect, label } = facet;
    const handleSelectChange = useCallback(
        (item: Item) => {
            onItemSelect([item]);
        },
        [items, onItemSelect]
    );

    return (
        <div>
            <Row>
                <Col>
                    <H6 data-cy="show-privacy">{label}</H6>
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
                                data-cy="show-datasets"
                            />
                        )}
                        onItemSelect={handleSelectChange}
                        filterable={false}
                        popoverProps={{ fill: true }}
                    >
                        <Button
                            className={styles.selectButton}
                            fill
                            rightIcon="caret-down"
                            text={selectedItems[0]?.label}
                            data-cy="show-all-data-set"
                        />
                    </Select>
                </Col>
            </Row>
        </div>
    );
}

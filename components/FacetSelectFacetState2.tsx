import { Button, Checkbox, H6, MenuItem } from "@blueprintjs/core";
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
                    <H6 data-cy="show-datasets">{label}</H6>
                    {items as Item[] && (
                        <div>
                            {items.map((itemValue: Item) => {
                                return (
                                    <><Checkbox
                                        key={itemValue.key}
                                        label={itemValue.label}
                                        id ={itemValue.label}
                                        value={itemValue.key}
                                        data-cy="datasets"
                                        onChange={(e) => {
                                            const item = items.find(item=> item.key === e.currentTarget.value)
                                            handleSelectChange(item as unknown as Item)
                                        }}
                                        defaultChecked={items.some(val => val.key === "all" ?? false)}
                                        checked={selectedItems?.some(l => l?.key === itemValue?.key) ?? false} 
                                        />
                                    </>
                                );
                            })}
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
}

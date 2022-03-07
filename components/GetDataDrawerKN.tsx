import { Drawer, Classes, Position } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import React from "react";
import { EsDatasetKN } from "../interfaces/EsDatasetKN";
import GetDataDrawerCardKN from "./GetDataDrawerCardKN";

export interface Props {
    drawerTitle: string;
    /** Content of the `distributions` array */
    distributions: Readonly<EsDatasetKN["distributions"]>;
    isOpen: boolean;
    onClose?: () => void;
}

export default function GetDataDrawerKN({
    drawerTitle,
    distributions,
    isOpen,
    onClose,
}: Props) {
    return (
        <Drawer
            icon="info-sign"
            onClose={onClose}
            title={drawerTitle}
            autoFocus
            canEscapeKeyClose
            canOutsideClickClose
            enforceFocus
            hasBackdrop
            isOpen={isOpen}
            position={Position.RIGHT}
            size="50%"
            usePortal
        >
            <div className={Classes.DRAWER_BODY} data-testid="metadata-drawer">
                <div className={Classes.DIALOG_BODY}>
                    {distributions?.map((d) => (
                        <Row key={d.identifier}>
                            <Col xs={12}>
                                <GetDataDrawerCardKN distribution={d} />
                            </Col>
                        </Row>
                    ))}
                </div>
            </div>
        </Drawer>
    );
}

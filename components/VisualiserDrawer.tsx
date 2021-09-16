import { Drawer, Classes, Position } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import VisualiserView from "./VisualiserView";

export interface Props {
    drawerTitle: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
}

export default function VisualiserDrawer({
    drawerTitle,
    datasetId,
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
            size="100%"
            usePortal
        >
            <div
                className={Classes.DRAWER_BODY}
                data-testid="visualiser-drawer"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                }}
            >
                <Row
                    disableDefaultMargins
                    align="stretch"
                    gutterWidth={0}
                    nogutter
                    nowrap
                    style={{ flex: 1 }}
                >
                    <Col xs={3}></Col>
                    <Col
                        xs={9}
                        style={{ position: "relative", display: "flex" }}
                    >
                        <VisualiserView datasetId={datasetId} />
                    </Col>
                </Row>
            </div>
        </Drawer>
    );
}

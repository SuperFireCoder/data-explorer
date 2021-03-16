import { Drawer, Classes, Position } from "@blueprintjs/core";
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
            <div className={Classes.DRAWER_BODY}>
                <VisualiserView datasetId={datasetId} />
            </div>
            {/* <div className={Classes.DRAWER_FOOTER}>Footer</div> */}
        </Drawer>
    );
}

import { Drawer, Classes, Position } from "@blueprintjs/core";
import MetadataView from "./MetadataView";

export interface Props {
    drawerTitle: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
}

export default function MetadataDrawer({
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
            size="50%"
            usePortal
        >
            <div className={Classes.DRAWER_BODY} data-testid="metadata-drawer">
                <div className={Classes.DIALOG_BODY}>
                    <MetadataView datasetId={datasetId} />
                </div>
            </div>
            {/* <div className={Classes.DRAWER_FOOTER}>Footer</div> */}
        </Drawer>
    );
}

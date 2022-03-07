import { Drawer, Classes, Position } from "@blueprintjs/core";
import React from "react";
import MetadataView from "./MetadataView";
import MetadataViewKN from "./MetadataViewKN";

export interface Props {
    drawerTitle: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
    exploreDataType: "dataExplorer" | "knowledgeNetwork";
}

export default function MetadataDrawer({
    drawerTitle,
    datasetId,
    isOpen,
    onClose,
    exploreDataType
}: Props) {

    const renderMetaView = () => {
        switch (exploreDataType) {
            case "dataExplorer": {
                return (
                    <>
                        <MetadataView datasetId={datasetId} /> 
                    </>
                )
            }
            case "knowledgeNetwork": {
                return (
                    <>
                        <MetadataViewKN datasetId={datasetId} /> 
                    </>
                )
            }
        }
    }

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
            isOpen={isOpen} // isOpen by default. set to true temp.
            position={Position.RIGHT}
            size="50%"
            usePortal
        >
            <div className={Classes.DRAWER_BODY} data-testid="metadata-drawer">
                <div className={Classes.DIALOG_BODY}>
                    {renderMetaView()}
                </div>
            </div>
            {/* <div className={Classes.DRAWER_FOOTER}>Footer</div> */}
        </Drawer>
    );
}

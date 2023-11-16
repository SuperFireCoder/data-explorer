import {
    Drawer,
    Classes,
    Position,
    OverlayToaster,
    Toast
} from "@blueprintjs/core";
import React, { useEffect, useState } from "react";

import { useInterval } from "../hooks/Interval";
import { getDataManagerUrl } from "../util/env";
import { ExternalFrame } from "./ExternalFrame";

export interface Props {
    datasetName: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
    triggerSearch?: () => void;
}

export default function DatasetEditDrawer({
    datasetName,
    datasetId,
    isOpen,
    onClose,
    triggerSearch
}: Props) {
    const [committed, setCommitted] = useState<boolean>(false);

    useInterval(() => {
        if (committed) {
            setCommitted(false);
        }
    }, 10000);

    useEffect(() => {
        window.addEventListener("message", function (event) {
            if (event.origin === getDataManagerUrl()) {
                if (
                    event.data.event_id === "dataset-updated" &&
                    event.data.dataset_data.id === datasetId
                ) {
                    if (triggerSearch) {
                        triggerSearch();
                    }
                    onClose?.();
                    setCommitted(true);
                }
            }
        });
    }, [datasetId]);

    const src = getDataManagerUrl() + "/edit/" + datasetId;

    return (
        <>
            <Drawer
                icon="edit"
                onClose={onClose}
                title="Edit dataset"
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
                <div className={Classes.DRAWER_BODY} data-testid="edit-drawer">
                    <ExternalFrame
                        src={src}
                        params={{
                            embed: "1"
                        }}
                    />
                </div>
            </Drawer>

            {committed && (
                <OverlayToaster maxToasts={1}>
                    <Toast
                        message={`Dataset ${datasetName} updated successfully`}
                        intent="success"
                        icon="tick"
                    />
                </OverlayToaster>
            )}
        </>
    );
}

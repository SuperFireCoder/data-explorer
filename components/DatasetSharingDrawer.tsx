import { Drawer, Classes, Position, Alert } from "@blueprintjs/core";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useEffect, useState } from "react";

import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";

export interface Props {
    datasetName: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
}

export default function DatasetSharingDrawer({
    datasetName,
    datasetId,
    isOpen,
    onClose,
}: Props) {
    const dataManager = useDataManager();

    const {
        isOpen: discardChangesAlertOpen,
        open: openDiscardChangesAlert,
        close: closeDiscardChangesAlert,
    } = useOpenableOpen();

    const [permissionsDelta, setPermissionsDelta] = useState(undefined);
    const [existingPermissions, setExistingPermissions] = useState<
        Record<string, string[]> | undefined
    >(undefined);

    const handleDrawerClose = useCallback(() => {
        // If there are changes to be committed, warn user
        if (permissionsDelta) {
            openDiscardChangesAlert();
            return;
        }

        // Otherwise close as normal
        onClose?.();
    }, [permissionsDelta, openDiscardChangesAlert, onClose]);

    const handleDiscardChangesAlertConfirmDiscard = useCallback(() => {
        // Close alert and close
        closeDiscardChangesAlert();
        onClose?.();
    }, [closeDiscardChangesAlert, onClose]);

    const handleDiscardChangesAlertAbortDiscard = useCallback(() => {
        // Just close alert
        closeDiscardChangesAlert();
    }, [closeDiscardChangesAlert]);

    useEffect(
        function fetchExistingPermissions() {
            if (!isOpen) {
                return;
            }

            // Wipe previous state
            setExistingPermissions(undefined);

            let cancellationToken: CancelTokenSource | undefined = undefined;

            (async () => {
                try {
                    // Fetch permissions
                    const {
                        promise,
                        cancellationToken: datasetPermissionCancellationToken,
                    } = dataManager.getDatasetPermissions(datasetId);

                    cancellationToken = datasetPermissionCancellationToken;

                    const existingPermissions = await promise;

                    // Store permissions in `existingPermissions`
                    setExistingPermissions(existingPermissions);
                } catch (e) {
                    // Ignore cancellation events
                    if (axios.isCancel(e)) {
                        return;
                    }

                    console.error(e);
                    alert(e.toString());
                }
            })();

            return function stopFetchingExistingPermissions() {
                cancellationToken?.cancel();
            };
        },
        [dataManager, datasetId, isOpen]
    );

    return (
        <>
            <Drawer
                icon="info-sign"
                onClose={handleDrawerClose}
                title={`Sharing "${datasetName}"`}
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
                <div
                    className={Classes.DRAWER_BODY}
                    data-testid="metadata-drawer"
                >
                    <div className={Classes.DIALOG_BODY}>
                        {existingPermissions === undefined ? (
                            "Loading..."
                        ) : (
                            <ul>
                                {Object.entries(existingPermissions).map(
                                    ([userId, permissions]) => (
                                        <li key={userId}>
                                            {userId}: {permissions.toString()}
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                </div>
                <div className={Classes.DRAWER_FOOTER}>Footer</div>
            </Drawer>
            <Alert
                cancelButtonText="Cancel"
                confirmButtonText="Discard changes"
                icon="trash"
                intent="warning"
                isOpen={discardChangesAlertOpen}
                onCancel={handleDiscardChangesAlertAbortDiscard}
                onConfirm={handleDiscardChangesAlertConfirmDiscard}
            >
                <p>Are you sure you wish to discard changes?</p>
            </Alert>
        </>
    );
}

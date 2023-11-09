import {
    Drawer,
    Classes,
    Position,
    OverlayToaster,
    Toast
} from "@blueprintjs/core";
import axios, { CancelTokenSource } from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";
import { useInterval } from "../hooks/Interval";
import { getDataManagerUrl } from "@ecocommons-australia/ui-library";

import DatasetSharingAddUserButton from "./DatasetSharingAddUserButton";
import { ExternalFrame } from "./ExternalFrame";
import DatasetSharingPermissionsList from "./DatasetSharingPermissionsList";

const SUPPORTED_PERMISSIONS = [
    {
        permission: "view_ds",
        label: "View",
        editDisabled: true
    },
    {
        permission: "download_ds",
        label: "Download",
        editDisabled: false
    },
    {
        permission: "delete_ds",
        label: "Delete",
        editDisabled: false
    }
] as const;

// const MESSAGE_TOASTER =
//     typeof document !== "undefined"
//         ? Toaster.create({
//               autoFocus: false,
//           })
//         : undefined;

type Permission = (typeof SUPPORTED_PERMISSIONS)[number]["permission"];

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
    const { dataManager, userSessionActive } = useDataManager();

    const {
        isOpen: discardChangesAlertOpen,
        open: openDiscardChangesAlert,
        close: closeDiscardChangesAlert
    } = useOpenableOpen();

    const [workingPermissions, setWorkingPermissions] = useState<
        Record<string, Permission[]>
    >({});

    const [existingPermissions, setExistingPermissions] = useState<
        Record<string, Permission[]> | undefined
    >(undefined);

    const [commitInProgress, setCommitInProgress] = useState<boolean>(false);
    const [committed, setCommitted] = useState<boolean>(false);

    // Calculate delta from working permissions and the last known state
    // (`existingPermissions`)
    const permissionsDelta = useMemo(() => {
        // Filter out added/modified???? and removed entries
        // Record<UserId, Permission[]>
        const modified: Record<string, Permission[]> = {};
        // UserId[]
        const removed: string[] = [];

        if (existingPermissions === undefined) {
            return {
                modified,
                removed
            };
        }

        for (const [userId, existingPermissionArray] of Object.entries(
            existingPermissions
        )) {
            // Check if entry exists in working permissions
            const workingPermissionArray: Permission[] | undefined =
                workingPermissions[userId];

            // If there is no record of this user, or array is empty,
            // mark as removed
            if (
                workingPermissionArray === undefined ||
                workingPermissionArray.length === 0
            ) {
                removed.push(userId);
                continue;
            }

            // If permission sets are NOT the same, mark modified
            if (
                existingPermissionArray.length !==
                    workingPermissionArray.length ||
                existingPermissionArray.some(
                    (x) => !workingPermissionArray.includes(x)
                )
            ) {
                modified[userId] = workingPermissionArray;
                continue;
            }
        }

        // Check for new entries
        for (const userId of Object.keys(workingPermissions)) {
            if (
                existingPermissions[userId] === undefined &&
                workingPermissions[userId].length > 0
            ) {
                modified[userId] = workingPermissions[userId];
            }
        }

        return {
            modified,
            removed
        };
    }, [existingPermissions, workingPermissions]);

    const hasUncommitedChanges = useMemo(() => {
        return (
            permissionsDelta.removed.length > 0 ||
            Object.keys(permissionsDelta.modified).length > 0
        );
    }, [permissionsDelta]);

    const handleDrawerClose = useCallback(() => {
        // If commit is in progress, don't close
        if (commitInProgress) {
            return;
        }

        // If there are changes to be committed, warn user
        if (hasUncommitedChanges) {
            openDiscardChangesAlert();
            return;
        }

        // Otherwise close as normal
        onClose?.();
    }, [
        commitInProgress,
        hasUncommitedChanges,
        openDiscardChangesAlert,
        onClose
    ]);

    const handleDiscardChangesAlertConfirmDiscard = useCallback(() => {
        // Close alert and close
        closeDiscardChangesAlert();
        onClose?.();
    }, [closeDiscardChangesAlert, onClose]);

    const handleDiscardChangesAlertAbortDiscard = useCallback(() => {
        // Just close alert
        closeDiscardChangesAlert();
    }, [closeDiscardChangesAlert]);



    const removeUser = useCallback((userId: string) => {
        // Set user's working permission to empty array to indicate user deleted
        setWorkingPermissions((p) => ({ ...p, [userId]: [] }));
    }, []);

    const addPermission = useCallback(
        (userId: string, permission: Permission) => {
            setWorkingPermissions((p) => ({
                ...p,
                [userId]: [...(p[userId] ?? []), permission]
            }));
        },
        [setWorkingPermissions]
    );

    const removePermission = useCallback(
        (userId: string, permission: Permission) => {
            setWorkingPermissions((p) => {
                const newPermissions = [...(p[userId] ?? [])].filter(
                    (x) => x !== permission
                );

                return {
                    ...p,
                    [userId]: newPermissions
                };
            });
        },
        []
    );

    const commitChanges = useCallback(async () => {
        try {
            setCommitInProgress(true);

            // Commit to API
            if (Object.keys(permissionsDelta.modified).length > 0) {
                const { promise } = dataManager.updateDatasetPermissions(
                    datasetId,
                    permissionsDelta.modified
                );
                await promise;
            }

            if (permissionsDelta.removed.length > 0) {
                const { promise } = dataManager.removeDatasetPermissions(
                    datasetId,
                    permissionsDelta.removed
                );
                await promise;
            }

            setCommitted(true);

            // Close drawer
            onClose?.();
        } catch (e) {
            console.error(e);
            alert(e.toString());
            setCommitted(false);
        } finally {
            setCommitInProgress(false);
        }
    }, [onClose, dataManager, datasetId, permissionsDelta]);

    useInterval(() => {
        if (committed) {
            setCommitted(false);
        }
    }, 5000);

    useEffect(
        function fetchExistingPermissions() {
            if (!isOpen) {
                return;
            }

            // Wipe previous state
            setExistingPermissions(undefined);
            setWorkingPermissions({});

            let cancellationToken: CancelTokenSource | undefined = undefined;

            (async () => {
                try {
                    // Fetch permissions
                    const {
                        promise,
                        cancellationToken: datasetPermissionCancellationToken
                    } = dataManager.getDatasetPermissions(datasetId);

                    cancellationToken = datasetPermissionCancellationToken;

                    const permissions: Record<string, string[]> = await promise;

                    // Filter out any invalid permissions and convert to the expected type
                    const filteredPermissions: Record<
                        string,
                        ("view_ds" | "delete_ds" | "download_ds")[]
                    > = {};
                    for (const [userId, permissionArray] of Object.entries(
                        permissions
                    )) {
                        const validPermissions = permissionArray.filter(
                            (permission) =>
                                [
                                    "view_ds",
                                    "delete_ds",
                                    "download_ds"
                                ].includes(permission)
                        );
                        filteredPermissions[userId] = validPermissions as (
                            | "view_ds"
                            | "delete_ds"
                            | "download_ds"
                        )[];
                    }
                    // Store permissions in `existingPermissions` and copy to `workingPermissions`
                    setExistingPermissions(filteredPermissions);
                    setWorkingPermissions({ ...filteredPermissions });
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

    useEffect(() => {
        window.addEventListener('message', function (event) {
            if (event.origin === "http://localhost:3003") {
                if (event.data.event_id === 'dataset-updated') {
                    if (triggerSearch) {
                        triggerSearch()
                    }
                    console.log("event2", event)
                    onClose?.()
                    // fetchDataset(e.data.dataset_data.id);
                    // Todo: run refresh function and close dawer
                }

            }
            // if (event.origin === getWorkflowBccvlUrl()) {
            //     // TODO, this may need to add a unique identifier for the workflow eg. 'sdm'
            //     if (event.data.event_id === 'workflow-job-id') {
            //         setJobExecuted(true);
            //     }
            // }
        });
    }, [triggerSearch, onClose]);

    // const src={getDataManagerUrl()+"?embed=1"}
    const src =
        "http://localhost:3003/edit/7e7da8f4-7236-11ee-abd5-0a580a640633";

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
                size="60%"
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
                        message="Changes to dataset share saved"
                        intent="success"
                        icon="tick"
                    />
                </OverlayToaster>
            )}
        </>
    );
}

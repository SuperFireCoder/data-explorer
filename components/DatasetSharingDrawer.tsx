import {
    Drawer,
    Classes,
    Position,
    Alert,
    Button,
    H4,
    OverlayToaster,
    Toast
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import axios, { CancelTokenSource } from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";
import { useInterval } from "../hooks/Interval";

import DatasetSharingAddUserButton from "./DatasetSharingAddUserButton";
import DatasetSharingPermissionsList from "./DatasetSharingPermissionsList";

const SUPPORTED_PERMISSIONS = [
    {
        permission: "view_ds",
        label: "View",
        editDisabled: true,
    },
    {
        permission: "download_ds",
        label: "Download",
        editDisabled: false,
    },
    {
        permission: "delete_ds",
        label: "Delete",
        editDisabled: false,
    }
] as const;

// const MESSAGE_TOASTER =
//     typeof document !== "undefined"
//         ? Toaster.create({
//               autoFocus: false,
//           })
//         : undefined;

type Permission = typeof SUPPORTED_PERMISSIONS[number]["permission"];

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
    const {dataManager, userSessionActive} = useDataManager();

    const {
        isOpen: discardChangesAlertOpen,
        open: openDiscardChangesAlert,
        close: closeDiscardChangesAlert,
    } = useOpenableOpen();

    const [workingPermissions, setWorkingPermissions] = useState<
        Record<string, Permission[]>
    >({});

    const [existingPermissions, setExistingPermissions] = useState<
        Record<string, Permission[]> | undefined
    >(undefined);

    const [commitInProgress, setCommitInProgress] = useState<boolean>(false);
    const [committed, setCommitted] = useState<boolean>(false);

    const existingPermissionsLoading = useMemo(
        () => existingPermissions === undefined,
        [existingPermissions]
    );

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
                removed,
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
            removed,
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
        onClose,
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

    const addNewUsers = useCallback((userIds: string[]) => {
        //set working permissions for each user addeded
        setWorkingPermissions((prevPermissions) => {
          const newPermissions: Record<string, Permission[]> = { ...prevPermissions };
      
          userIds.forEach((userId) => {
            // Check if already present
            const workingPermissionArray: Permission[] | undefined =
              newPermissions[userId];
            // If the permissions are previously added, no need to add them again
            if (
              workingPermissionArray !== undefined &&
              workingPermissionArray.length !== 0
            ) {
              return;
            }
            // Add view permission by default
            newPermissions[userId] = ["view_ds", "download_ds"];
          });
      
          return newPermissions;
        });
    }, []);
      
    const removeUser = useCallback((userId: string) => {
        // Set user's working permission to empty array to indicate user deleted
        setWorkingPermissions((p) => ({ ...p, [userId]: [] }));
    }, []);

    const addPermission = useCallback(
        (userId: string, permission: Permission) => {
            setWorkingPermissions((p) => ({
                ...p,
                [userId]: [...(p[userId] ?? []), permission],
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
                    [userId]: newPermissions,
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
        if (committed){
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
                        cancellationToken: datasetPermissionCancellationToken,
                    } = dataManager.getDatasetPermissions(datasetId);
                
                    cancellationToken = datasetPermissionCancellationToken;
                
                    const permissions: Record<string, string[]> = await promise;
                    
                    // Filter out any invalid permissions and convert to the expected type
                    const filteredPermissions: Record<string, ("view_ds" | "delete_ds" | "download_ds")[]> = {};
                    for (const [userId, permissionArray] of Object.entries(permissions)) {
                        const validPermissions = permissionArray.filter(permission =>
                            ["view_ds", "delete_ds", "download_ds"].includes(permission)
                        );
                        filteredPermissions[userId] = validPermissions as ("view_ds" | "delete_ds" | "download_ds")[];
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

    return (
        <>
            <Drawer
                icon="share"
                onClose={handleDrawerClose}
                title="Share dataset"
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
                    data-testid="sharing-drawer"
                >
                    <div className={Classes.DIALOG_BODY}>
                        {existingPermissions === undefined ? (
                            "Loading..."
                        ) : (
                            <>
                                <H4>{datasetName}</H4>
                                <DatasetSharingPermissionsList
                                    supportedPermissions={SUPPORTED_PERMISSIONS}
                                    permissions={workingPermissions}
                                    disabled={commitInProgress}
                                    onRemoveUser={removeUser}
                                    onAddUserPermission={addPermission}
                                    onRemoveUserPermission={removePermission}
                                />
                            </>
                        )}
                    </div>
                </div>
                <div className={Classes.DRAWER_FOOTER}>
                    <Row disableDefaultMargins>
                        <Col>
                            <DatasetSharingAddUserButton
                                disabled={existingPermissionsLoading}
                                onAddUsers={addNewUsers}
                            />
                        </Col>
                        <Col xs="content">
                            <Button
                                intent="success"
                                disabled={
                                    !hasUncommitedChanges ||
                                    existingPermissionsLoading
                                }
                                loading={commitInProgress}
                                onClick={commitChanges}
                            >
                                Save changes
                            </Button>
                        </Col>
                    </Row>
                </div>
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
            { committed && 
                <OverlayToaster maxToasts={1}>
                    <Toast 
                        message="Changes to dataset share saved"
                        intent="success"
                        icon="tick"
                    />
                </OverlayToaster>
            }
        </>
    );
}

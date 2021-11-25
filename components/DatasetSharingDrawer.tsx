import {
    Drawer,
    Classes,
    Position,
    Alert,
    Button,
    H4,
    Toaster,
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";
import DatasetSharingAddUserButton from "./DatasetSharingAddUserButton";
import DatasetSharingPermissionsList from "./DatasetSharingPermissionsList";

const SUPPORTED_PERMISSIONS = [
    {
        permission: "view_ds",
        label: "View dataset",
        editDisabled: true,
    },
    {
        permission: "delete_ds",
        label: "Delete dataset",
        editDisabled: false,
    },
] as const;

const MESSAGE_TOASTER =
    typeof document !== "undefined"
        ? Toaster.create({
              autoFocus: false,
          })
        : undefined;

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
    const dataManager = useDataManager();

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

    const addNewUser = useCallback(
        (userId: string) => {
            // Check if already present
            const workingPermissionArray: Permission[] | undefined =
                workingPermissions[userId];

            if (
                workingPermissions[userId] !== undefined &&
                workingPermissionArray.length !== 0
            ) {
                return;
            }

            // Add to working permissions object
            setWorkingPermissions((p) => ({ ...p, [userId]: ["view_ds"] }));
        },
        [workingPermissions]
    );

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

            // Close drawer
            onClose?.();

            // Give message to user that commit completed
            MESSAGE_TOASTER?.show({
                message: "Changes to dataset share saved",
                intent: "success",
                icon: "tick",
            });
        } catch (e) {
            console.error(e);
            alert(e.toString());
        } finally {
            setCommitInProgress(false);
        }
    }, [onClose, dataManager, datasetId, permissionsDelta]);

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

                    const permissions = await promise;

                    // Store permissions in `existingPermissions` and copy to
                    // `newPermissions`
                    setExistingPermissions(
                        permissions as typeof existingPermissions
                    );
                    setWorkingPermissions(
                        permissions as typeof workingPermissions
                    );
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
                                onAddUser={addNewUser}
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
        </>
    );
}

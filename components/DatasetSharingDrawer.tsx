import {
    Drawer,
    Classes,
    Position,
    Alert,
    Button,
    Popover,
    Switch,
    H3,
    H4,
    Icon,
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import axios, { CancelTokenSource } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";

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

    const [newPermissions, setNewPermissions] = useState<
        Record<string, Permission[]> | undefined
    >(undefined);
    const [existingPermissions, setExistingPermissions] = useState<
        Record<string, Permission[]> | undefined
    >(undefined);
    const [commitInProgress, setCommitInProgress] = useState<boolean>(false);

    const existingPermissionsLoading = useMemo(
        () => existingPermissions === undefined,
        [existingPermissions]
    );

    const displayedPermissions = useMemo(() => {
        // Merge the two permission objects
        const permissions = { ...existingPermissions, ...newPermissions };

        // Remove entries where the permission array is empty
        for (const key of Object.keys(permissions)) {
            if (permissions[key].length === 0) {
                delete permissions[key];
            }
        }

        return permissions;
    }, [newPermissions, existingPermissions]);

    // Calculate delta from displayed permissions and the last known state
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
            // Check if entry exists in displayed permissions
            const displayedPermissionArray: Permission[] | undefined =
                displayedPermissions[userId];

            // If there is no record of this user, mark removed
            if (displayedPermissionArray === undefined) {
                removed.push(userId);
                continue;
            }

            // If permission sets are NOT the same, mark modified
            if (
                existingPermissionArray.length !==
                    displayedPermissionArray.length ||
                existingPermissionArray.some(
                    (x) => !displayedPermissionArray.includes(x)
                )
            ) {
                modified[userId] = displayedPermissionArray;
                continue;
            }
        }

        // Check for new entries
        for (const userId of Object.keys(displayedPermissions)) {
            if (existingPermissions[userId] === undefined) {
                modified[userId] = displayedPermissions[userId];
            }
        }

        return {
            modified,
            removed,
        };
    }, [existingPermissions, displayedPermissions]);

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

    const addNewUser = useCallback(() => {
        const userId = window.prompt("User ID?");

        if (userId === null || userId.length === 0) {
            return;
        }

        // Check if already present
        if (displayedPermissions[userId] !== undefined) {
            return;
        }

        // Add to new permissions object
        setNewPermissions((p) => ({ ...p, [userId]: ["view_ds"] }));
    }, [displayedPermissions]);

    const removeUser = useCallback((userId: string) => {
        // Set user's new permission to empty array to indicate user deleted
        setNewPermissions((p) => ({ ...p, [userId]: [] }));
    }, []);

    const addPermission = useCallback(
        (userId: string, permission: Permission) => {
            setNewPermissions((p) => ({
                ...p,
                [userId]: [...(p?.[userId] ?? []), permission],
            }));
        },
        [setNewPermissions]
    );

    const removePermission = useCallback(
        (userId: string, permission: Permission) => {
            setNewPermissions((p) => {
                const newPermissions = [...(p?.[userId] ?? [])].filter(
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
                const { promise } = dataManager.addDatasetPermissions(
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
            setNewPermissions(undefined);

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

                    // Store permissions in `existingPermissions`
                    setExistingPermissions(
                        permissions as typeof existingPermissions
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
                    data-testid="metadata-drawer"
                >
                    <div className={Classes.DIALOG_BODY}>
                        {existingPermissions === undefined ? (
                            "Loading..."
                        ) : (
                            <>
                                <H4>{datasetName}</H4>
                                {Object.entries(displayedPermissions).map(
                                    ([userId, permissions]) => (
                                        <Row key={userId} align="center">
                                            <Col
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5em",
                                                }}
                                            >
                                                <Icon
                                                    icon="user"
                                                    iconSize={32}
                                                    style={{
                                                        color: "rgba(0,0,0,0.2)",
                                                    }}
                                                />
                                                {userId}
                                            </Col>
                                            <Col xs="content">
                                                <Popover
                                                    content={
                                                        <div
                                                            style={{
                                                                padding: "1em",
                                                            }}
                                                        >
                                                            {SUPPORTED_PERMISSIONS.map(
                                                                ({
                                                                    permission,
                                                                    label,
                                                                    editDisabled,
                                                                }) => (
                                                                    <Switch
                                                                        key={
                                                                            permission
                                                                        }
                                                                        label={
                                                                            label
                                                                        }
                                                                        disabled={
                                                                            editDisabled
                                                                        }
                                                                        checked={permissions.includes(
                                                                            permission
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            e
                                                                                .currentTarget
                                                                                .checked
                                                                                ? addPermission(
                                                                                      userId,
                                                                                      permission
                                                                                  )
                                                                                : removePermission(
                                                                                      userId,
                                                                                      permission
                                                                                  )
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    }
                                                >
                                                    <Button small>
                                                        {permissions
                                                            .map(
                                                                (p) =>
                                                                    SUPPORTED_PERMISSIONS.find(
                                                                        (x) =>
                                                                            x.permission ===
                                                                            p
                                                                    )?.label
                                                            )
                                                            .join(", ")}
                                                    </Button>
                                                </Popover>
                                            </Col>
                                            <Col xs="content">
                                                <Button
                                                    small
                                                    minimal
                                                    intent="danger"
                                                    icon="trash"
                                                    onClick={() =>
                                                        removeUser(userId)
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </Col>
                                        </Row>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className={Classes.DRAWER_FOOTER}>
                    <Row disableDefaultMargins>
                        <Col>
                            <Button
                                icon="plus"
                                onClick={addNewUser}
                                disabled={existingPermissionsLoading}
                            >
                                Add user
                            </Button>
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

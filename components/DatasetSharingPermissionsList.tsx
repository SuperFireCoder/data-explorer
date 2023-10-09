import { Button, Icon, Popover, Switch } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { CancelTokenSource } from "axios";
import React, { useEffect, useState } from "react";
import { useUserManagement } from "../hooks/UserManagement";

export interface Props<P extends string> {
    supportedPermissions: readonly {
        permission: P;
        label: string;
        editDisabled: boolean;
    }[];
    permissions: Record<string, readonly P[]>;
    disabled?: boolean;

    onRemoveUser?: (userId: string) => void;
    onAddUserPermission?: (userId: string, permission: P) => void;
    onRemoveUserPermission?: (userId: string, permission: P) => void;
}

export default function DatasetSharingPermissionsList<P extends string>({
    supportedPermissions,
    permissions,
    disabled,
    onRemoveUser,
    onAddUserPermission,
    onRemoveUserPermission,
}: Props<P>) {
    const userManagement = useUserManagement();

    const [userIdNameLookup, setUserIdNameLookup] = useState<
        Record<
            string,
            | undefined
            | {
                  firstName?: string;
                  lastName?: string;
                  email: string;
              }
        >
    >({});

    useEffect(
        function requestUserInfo() {
            if (userManagement === undefined) {
                return;
            }

            // Request information on user IDs which we don't have information
            // about
            const userIds = Object.keys(permissions);
            const knownUserIds = Object.keys(userIdNameLookup);

            const userIdsToFetch = userIds.filter(
                (x) => !knownUserIds.includes(x)
            );

            if (userIdsToFetch.length === 0) {
                return;
            }

            let requestCancellationToken: CancelTokenSource | undefined =
                undefined;

            (async () => {
                const { promise, cancellationToken } =
                    userManagement.lookupUserById(userIdsToFetch);

                requestCancellationToken = cancellationToken;

                const userInfo = await promise;

                setUserIdNameLookup((obj) => {
                    const newObj = { ...obj };

                    userInfo.forEach((user) => {
                        newObj[user.id] = {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                        };
                    });

                    return newObj;
                });
            })();

            return function stopRequestUserInfo() {
                requestCancellationToken?.cancel();
            };
        },
        [userManagement, userIdNameLookup, permissions]
    );

    return (
        <>
            {Object.entries(permissions).map(([userId, userPermissions], i) => {
                if (userPermissions.length === 0) {
                    return null;
                }

                const userInfo = userIdNameLookup[userId];
                const name =
                    userInfo === undefined
                        ? "..."
                        : `${userInfo.firstName ?? ""} ${
                              userInfo.lastName ?? ""
                          }`;

                return (
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
                            <div>
                                <div>{name}</div>
                                <div>
                                    <i>{userInfo?.email}</i>
                                </div>
                            </div>
                        </Col>
                        <Col xs="content">
                            <Popover
                                disabled={disabled}
                                content={
                                    <div
                                        style={{
                                            padding: "1em",
                                        }}
                                    >
                                        {supportedPermissions.map(
                                            ({
                                                permission,
                                                label,
                                                editDisabled,
                                            }) => (
                                                <Switch
                                                    key={permission}
                                                    label={label}
                                                    disabled={editDisabled}
                                                    checked={userPermissions.includes(
                                                        permission
                                                    )}
                                                    onChange={(e) =>
                                                        e.currentTarget.checked
                                                            ? onAddUserPermission?.(
                                                                  userId,
                                                                  permission
                                                              )
                                                            : onRemoveUserPermission?.(
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
                                <Button small disabled={disabled}>
                                    {userPermissions
                                        .map(
                                            (p) =>
                                                supportedPermissions.find(
                                                    (x) => x.permission === p
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
                                onClick={() => onRemoveUser?.(userId)}
                                disabled={disabled}
                            >
                                Remove
                            </Button>
                        </Col>
                    </Row>
                );
            })}
        </>
    );
}

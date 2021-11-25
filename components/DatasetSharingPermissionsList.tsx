import { Button, Icon, Popover, Switch } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";

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
    return (
        <>
            {Object.entries(permissions).map(([userId, userPermissions]) =>
                userPermissions.length === 0 ? null : (
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
                )
            )}
        </>
    );
}

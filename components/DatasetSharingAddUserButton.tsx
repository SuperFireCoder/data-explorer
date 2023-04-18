import {
    Button,
    FormGroup,
    IIntentProps,
    InputGroup,
    Popover,
} from "@blueprintjs/core";
import { FormEventHandler, useCallback, useRef, useState } from "react";
import { useOpenableOpen } from "../hooks/Openable";
import { useUserManagement } from "../hooks/UserManagement";

export interface Props {
    disabled?: boolean;
    onAddUser?: (userId: string) => void;
}

export default function DatasetSharingAddUserButton({
    disabled,
    onAddUser,
}: Props) {
    const {
        isOpen: popoverOpen,
        open: openPopover,
        close: _closePopover,
    } = useOpenableOpen();
    const userManagement = useUserManagement();
    const emailInputRef = useRef<HTMLInputElement | null>(null);

    const [emailInputDecorationState, setEmailInputDecorationState] = useState<
        IIntentProps & { helperText: string }
    >({ helperText: "" });
    const [userAddInProgress, setUserAddInProgress] = useState<boolean>(false);

    const closePopover = useCallback(() => {
        // Close popover
        _closePopover();

        // Wipe email input decoration state
        setEmailInputDecorationState({ helperText: "" });
    }, [_closePopover]);

    const focusInputOnPopoverOpen = useCallback(() => {
        emailInputRef.current?.focus();
    }, []);

    const handleFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                setUserAddInProgress(true);

                if (userManagement === undefined) {
                    throw new Error("User management API not available");
                }

                // Check user email address
                const userEmail = emailInputRef.current?.value?.trim();

                if (userEmail === undefined || userEmail.length === 0) {
                    return;
                }

                // Check user email and get user information
                const { promise } = userManagement.lookupUserByEmail(userEmail.toLowerCase());
                const userInfo = await promise;

                if (userInfo.length === 0) {
                    setEmailInputDecorationState({
                        intent: "danger",
                        helperText: `"${userEmail}" not found`,
                    });
                    return;
                }

                // Pass to handler
                onAddUser?.(userInfo[0].id);

                // Close popover
                closePopover();
            } catch (e) {
                console.error(e);
                alert(e.toString());
            } finally {
                setUserAddInProgress(false);
            }
        },
        [onAddUser, closePopover]
    );

    return (
        <Popover
            disabled={disabled}
            isOpen={popoverOpen}
            onClose={closePopover}
            onOpening={focusInputOnPopoverOpen}
            content={
                <form onSubmit={handleFormSubmit} style={{ padding: "1rem" }}>
                    <FormGroup
                        label="Enter the email address of the user to share with"
                        intent={emailInputDecorationState.intent}
                        helperText={emailInputDecorationState.helperText}
                    >
                        <InputGroup
                            inputRef={emailInputRef}
                            disabled={disabled || userAddInProgress}
                            type="email"
                            placeholder="user@example.com"
                            rightElement={
                                <Button
                                    type="submit"
                                    icon="arrow-right"
                                    disabled={disabled || userAddInProgress}
                                    minimal
                                    loading={userAddInProgress}
                                />
                            }
                        />
                    </FormGroup>
                </form>
            }
        >
            <Button icon="plus" disabled={disabled} onClick={openPopover}>
                Add user
            </Button>
        </Popover>
    );
}

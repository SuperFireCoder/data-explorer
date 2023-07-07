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
    onAddUsers?: (userEmails: string[]) => void;
}

export default function DatasetSharingAddUserButton({
    disabled,
    onAddUsers,
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
    
                // Check user email addresses
                const userEmails = emailInputRef.current?.value?.trim().split(",").map(item => item.trim());
               
                // Once user submit emails 
                if (userEmails?.length){
                    // create comma separated string from userEmails as we can pass that to lookupUserByEmail
                    const commaSeparatedString: string = userEmails?.map(item => item.toLowerCase()).join(', ');
                    
                    // Check user email and get user information
                    const { promise } = userManagement.lookupUserByEmail(commaSeparatedString);
                    const userInfo = await promise;
    
                    // if (userInfo.length === 0) {
                    //     usersNotFound.push(userEmail);
                    // } else {
                    
                    // Filter out user not found emails
                    const usersNotFound = userEmails.filter(email => {
                    const lowerCaseEmail = email.toLowerCase();
                    return !userInfo.some(item => item.email.toLowerCase() === lowerCaseEmail);
                    });
                    
                    // Pass to handler
                    onAddUsers?.(userInfo.map((user) => user.id));

                // Show warning for not found users
                if (usersNotFound.length > 0) {
                    setEmailInputDecorationState({
                        intent: "danger",
                        helperText: `Users not found: ${usersNotFound.join(", ")}`,
                    });}
                } else {
                    // Close popover
                    closePopover();
                }
            } catch (e) {
                console.error(e);
                alert(e.toString());
            } finally {
                setUserAddInProgress(false);
            }
        },
        [onAddUsers, closePopover]
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
                        label="Enter the email addresses of the users to share with"
                        intent={emailInputDecorationState.intent}
                        helperText={emailInputDecorationState.helperText}
                    >
                        <InputGroup
                            inputRef={emailInputRef}
                            disabled={disabled || userAddInProgress}
                            placeholder="user1@example.com, user2@example.com"
                            rightElement={
                                <Button
                                    type="submit"
                                    icon="arrow-right"
                                    disabled={disabled || userAddInProgress}
                                    minimal
                                    loading={userAddInProgress}
                                />
                            }
                        // style={{ width: "300px", height: "100px" }} 
                        />
                    </FormGroup>
                </form>
            }
        >
            <Button icon="plus" disabled={disabled} onClick={openPopover}>
                Add users
            </Button>
        </Popover>
    );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    Button,
    H5,
    Menu,
    MenuDivider,
    MenuItem,
    Popover,
    Position,
} from "@blueprintjs/core";

import { useKeycloakInfo } from "../util/keycloak";

export default function SignInOutButton() {
    const router = useRouter();
    const { keycloak, initialized } = useKeycloakInfo();

    // NOTE: In some circumstances this button appears wrong, which James
    // suspects is due to sudden changes in client (when Keycloak finds out
    // that the user is signed in when init'ing) vs SSR content, but aren't
    // reconciled with React properly

    // DO NOT REMOVE
    // This is a fix to force React to re-render the button if the Keycloak
    // object changes - this changes a number which is used as a key for the
    // buttons below
    const [forceUpdateKey, setForceUpdateState] = useState<number>(0);
    useEffect(
        () => setForceUpdateState((x) => x + 1),
        [keycloak, keycloak?.authenticated, initialized]
    );

    if (!keycloak) {
        return (
            <Button key={forceUpdateKey} intent="none" outlined>
                Please wait...
            </Button>
        );
    }

    const authenticated = keycloak.authenticated;

    if (authenticated) {
        const displayedName =
            (keycloak.tokenParsed as Record<string, string> | undefined)
                ?.given_name ??
            keycloak.tokenParsed?.name ??
            "";

        return (
            <Popover
                content={
                    <div>
                        <div style={{ padding: "10px 12px 5px", maxWidth: "25em" }}>
                            <H5 style={{ margin: 0 }}>
                                {keycloak.tokenParsed?.name}
                            </H5>
                        </div>
                        <Menu>
                            <MenuItem
                                icon="id-number"
                                text="Manage account"
                                onClick={() =>
                                    router.push(keycloak.createAccountUrl())
                                }
                            />
                            <MenuDivider />
                            <MenuItem
                                icon="log-out"
                                text="Sign out"
                                onClick={() =>
                                    router.push(keycloak.createLogoutUrl())
                                }
                            />
                        </Menu>
                    </div>
                }
                position={Position.BOTTOM_RIGHT}
            >
                <Button
                    key={forceUpdateKey}
                    intent="none"
                    icon="user"
                    rightIcon="caret-down"
                    outlined
                >
                    {displayedName}
                </Button>
            </Popover>
        );
    } else {
        return (
            <Button
                key={forceUpdateKey}
                intent="success"
                outlined
                onClick={() => router.push(keycloak.createLoginUrl())}
            >
                Sign in / Register
            </Button>
        );
    }
}

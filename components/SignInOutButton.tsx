import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { KeycloakInstance } from "keycloak-js";
import { Button } from "@blueprintjs/core";
import { useKeycloak } from "@react-keycloak/ssr";

export default function SignInOutButton() {
    const router = useRouter();
    const { keycloak, initialized } = useKeycloak<KeycloakInstance>();

    // NOTE: In some circumstances this button appears wrong, which James
    // suspects is due to sudden changes in client (when Keycloak finds out
    // that the user is signed in when init'ing) vs SSR content, but aren't
    // reconciled with React properly

    // DO NOT REMOVE
    // This is a fix to force React to re-render the button if the Keycloak
    // object changes - this changes a number which is used as a key for the
    // buttons below
    const [forceUpdateKey, setForceUpdateState] = useState<number>(0);
    useEffect(() => setForceUpdateState((x) => x + 1), [
        keycloak,
        keycloak?.authenticated,
        initialized,
    ]);

    if (!keycloak) {
        return (
            <Button key={forceUpdateKey} intent="none" outlined>
                Please wait...
            </Button>
        );
    }

    const authenticated = keycloak.authenticated;

    if (authenticated) {
        return (
            <Button
                key={forceUpdateKey}
                intent="warning"
                outlined
                onClick={() => router.push(keycloak.createLogoutUrl())}
            >
                Sign out
            </Button>
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

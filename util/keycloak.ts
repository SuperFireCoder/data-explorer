import { useMemo } from "react";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "../interfaces/Keycloak";

export function useKeycloakInfo() {

    const { keycloak, initialized } = useKeycloak<KeycloakInstance>();

    /** Whether a user is signed in and has an active session */
    const userSessionActive = useMemo<Boolean>(
        () => keycloak?.token !== undefined,
        [keycloak?.authenticated, keycloak?.token]
    );

    return  { 
        keycloak,
        initialized,
        userSessionActive
    }
}

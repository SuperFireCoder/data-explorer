import { useMemo } from "react";
import { UserManagement } from "../util/userManagement";
import { getUserManagementBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";

export function useUserManagement() {
    const { keycloak } = useKeycloakInfo();

    /** User Management object handling XHR calls to the server */
    const userManagement = useMemo(() => {
        if (keycloak?.authenticated) {
            return new UserManagement(
                getUserManagementBackendServerUrl(),
                keycloak
            );
        }

        return undefined;
    }, [keycloak, keycloak?.authenticated]);

    return userManagement;
}

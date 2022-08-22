import { useMemo, useEffect, useRef } from "react";
import { DataManager } from "../util/dataManager";
import { getDataExplorerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";

export function useDataManager() {
    const { keycloak } = useKeycloakInfo();
    const keycloakInstance = useRef(keycloak);
    useEffect(
        function updateKeycloakInstanceRefOnChange() {
            keycloakInstance.current = keycloak;
        },
        [keycloak?.authenticated, keycloak?.token]
    );

    /** Data Manager object handling XHR calls to the server */
    const dataManager = useMemo(() => {
        return new DataManager(
            getDataExplorerBackendServerUrl(),
            keycloak?.authenticated ? keycloak : undefined
        );
    }, [keycloak, keycloak?.authenticated]);

    return dataManager;
}

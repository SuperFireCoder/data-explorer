import { useMemo } from "react";
import { DataManager } from "../util/dataManager";
import { getDataExplorerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";

export function useDataManager() {
    const { keycloak } = useKeycloakInfo();

    /** Data Manager object handling XHR calls to the server */
    const dataManager = useMemo(
        () =>
            new DataManager(
                getDataManagerBackendServerUrl(),
                keycloakInstance.current
            ),
        []
    );

    const userSessionActive = useMemo(
        () => keycloak?.token !== undefined,
        [keycloak?.authenticated, keycloak?.token]
    );


    return {dataManager, userSessionActive}
}

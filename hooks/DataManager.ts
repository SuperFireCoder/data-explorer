import { useEffect, useMemo, useRef } from "react";
import { DataManager } from "../util/dataManager";
import { getDataManagerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";

export function useDataManager() {
    const { keycloak } = useKeycloakInfo();

    // Internal copy of the Keycloak object
    const keycloakInstance = useRef(keycloak);

    // Keep track of the Keycloak object and save the reference if the object
    // changes
    useEffect(
        function updateKeycloakInstanceRefOnChange() {
            keycloakInstance.current = keycloak;
        },
        [keycloak?.authenticated, keycloak?.token]
    );

    /** Data Manager object handling XHR calls to the server */
    const dataManager = useMemo(
        () =>
            new DataManager(
                getDataManagerBackendServerUrl(),
                () => keycloakInstance.current
            ),
        []
    );

        /** Whether a user is signed in and has an active session */
        const userSessionActive = useMemo(
            () => keycloak?.token !== undefined,
            [keycloak?.authenticated, keycloak?.token]
        );

    return {dataManager, userSessionActive,}
}



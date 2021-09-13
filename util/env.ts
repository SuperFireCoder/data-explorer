import getConfig from "next/config";

const config = getConfig();

export function getDataExplorerBackendServerUrl() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL as string;
}

export function getDataExplorerSubbarImportData() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_DATA_EXPLORER_SUBBAR_IMPORT_DATA as string | undefined;
}

export function getKeycloakAuthParameters() {
    return {
        url: config.publicRuntimeConfig.NEXT_PUBLIC_KEYCLOAK_AUTH_URL as string,
        realm: config.publicRuntimeConfig
            .NEXT_PUBLIC_KEYCLOAK_AUTH_REALM as string,
        clientId: config.publicRuntimeConfig
            .NEXT_PUBLIC_KEYCLOAK_AUTH_CLIENT_ID as string,
    };
}

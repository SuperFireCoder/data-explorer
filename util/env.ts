export function getDataExplorerBackendServerUrl() {
    return process.env.NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL as string;
}

export function getKeycloakAuthParameters() {
    return {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_URL as string,
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_REALM as string,
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_CLIENT_ID as string,
    };
}

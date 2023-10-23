import getConfig from "next/config";

const config = getConfig();

export const IS_DEVELOPMENT = config.publicRuntimeConfig.NEXT_PUBLIC_DEPLOYMENT !== "production";

export const IS_BSC = String(config.publicRuntimeConfig.NEXT_PUBLIC_KEYCLOAK_AUTH_URL)
                        .match(/biosecuritycommons/) !== null
                        || config.publicRuntimeConfig.NEXT_PUBLIC_THEME === 'bsc-theme';
                        
export function getDataExplorerBackendServerUrl() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL as string;
}

export function getUserManagementBackendServerUrl() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_USER_MANAGEMENT_BACKEND_SERVER_URL as string;
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

export function getGoogleAnalyticsTrackingId() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID as string;
}

export function getWorkFlowUrl() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_WORKFLOW_URL as string;
}

export function getWorkSpaceUrl() {
    return config.publicRuntimeConfig
        .NEXT_PUBLIC_WORKSPACE_URL as string;
}

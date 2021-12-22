// Transpile `ol` from ES Modules -> CommonJS
const withTM = require("next-transpile-modules")([
    "ol",
    "@ecocommons-australia/visualiser",
    "@ecocommons-australia/visualiser-client-geospatial",
]);
module.exports = withTM();

// Will be available on both server and client
module.exports.publicRuntimeConfig = {
    NEXT_PUBLIC_DEPLOYMENT:
        process.env.NEXT_PUBLIC_DEPLOYMENT,

    NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ROOT:
        process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ROOT,
    NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_WORKSPACE:
        process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_WORKSPACE,
    NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_DATASETS:
        process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_DATASETS,
    NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ANALYSIS_HUB:
        process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ANALYSIS_HUB,

    NEXT_PUBLIC_KEYCLOAK_AUTH_URL: process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_URL,
    NEXT_PUBLIC_KEYCLOAK_AUTH_REALM:
        process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_REALM,
    NEXT_PUBLIC_KEYCLOAK_AUTH_CLIENT_ID:
        process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_CLIENT_ID,

    NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL:
        process.env.NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL,
    NEXT_PUBLIC_DATA_EXPLORER_SUBBAR_IMPORT_DATA:
        process.env.NEXT_PUBLIC_DATA_EXPLORER_SUBBAR_IMPORT_DATA,

    NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL:
        process.env
            .NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL,

    NEXT_PUBLIC_USER_MANAGEMENT_BACKEND_SERVER_URL:
        process.env.NEXT_PUBLIC_USER_MANAGEMENT_BACKEND_SERVER_URL,
};

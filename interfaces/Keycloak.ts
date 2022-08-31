import { KeycloakInstance as _KeycloakInstance } from "keycloak-js";

export interface KeycloakInstance extends _KeycloakInstance {
    tokenParsed?: _KeycloakInstance["tokenParsed"] & {
        name?: string;
    };
}

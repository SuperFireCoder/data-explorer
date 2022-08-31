import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "../interfaces/Keycloak";

export function useKeycloakInfo() {
    return useKeycloak<KeycloakInstance>();
}

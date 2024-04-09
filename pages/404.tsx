import {
    FixedContainer,
    HtmlHead,
} from "@ecocommons-australia/ui-library";
import Header from "../components/Header";
import { useKeycloakInfo } from "../util/keycloak";

export default function NotFound() {
    const { keycloak } = useKeycloakInfo();

    if (keycloak?.authenticated === undefined) {
        // This must always return nothing as the output 
        // must match the SSR page render (also nothing).
        return null;
    }

    return (
        <>
            <HtmlHead title="Not found" />
            <Header activeTab="datasets" />
            <FixedContainer>
                <h1>Not found</h1>
                <p>The page you&apos;re trying to reach could not be found.</p>
            </FixedContainer>
        </>
    );
}

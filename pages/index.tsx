import { FixedContainer, HtmlHead } from "@ecocommons-australia/ui-library";

import Header from "../components/Header";
import { useKeycloakInfo } from "../util/keycloak";

export default function IndexPage() {
    const { keycloak } = useKeycloakInfo();

    return (
        <>
            <HtmlHead />
            <Header />
            <FixedContainer>
                <h1 data-testid="welcome-user">
                    Welcome
                    {keycloak?.tokenParsed && `, ${keycloak.tokenParsed.name}`}
                </h1>
                <h2>Welcome</h2>
                <h3>Welcome</h3>
                <h4>Welcome</h4>
                <h5>Welcome</h5>
                <h6>Welcome</h6>
            </FixedContainer>
        </>
    );
}

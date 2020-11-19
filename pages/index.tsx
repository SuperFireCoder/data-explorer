import { FixedContainer, HtmlHead } from "@ecocommons-australia/ui-library";
import { useKeycloak } from "@react-keycloak/ssr";

import Header from "../components/Header";
import { KeycloakInstance } from "../interfaces/Keycloak";

export default function Index() {
    const { keycloak } = useKeycloak<KeycloakInstance>();

    return (
        <>
            <HtmlHead />
            <Header />
            <FixedContainer>
                <h1>
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

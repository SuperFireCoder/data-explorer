import cookie from "cookie";
import { AppProps, AppContext } from "next/app";
import Link from "next/link";
import { IncomingMessage } from "http";
import { SSRKeycloakProvider, SSRCookies } from "@react-keycloak/ssr";
import { LinkContext } from "@ecocommons-australia/ui-library";

// Blueprint required CSS
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import "@ecocommons-australia/ui-library/src/styles/globals.css";

/** react-keycloak configuration */
const keycloakConfig = {
    url: "https://auth.dev.ecocommons.org.au/auth",
    realm: "ecocommons-dev",
    clientId: "localhost-client",
};

interface Props extends AppProps {
    /** Cookies in request */
    cookies: unknown;
}

function MyApp({ Component, pageProps, cookies }: Props) {
    return (
        <LinkContext.Provider value={{ Link }}>
            <SSRKeycloakProvider
                keycloakConfig={keycloakConfig}
                persistor={SSRCookies(cookies)}
            >
                <Component {...pageProps} />
            </SSRKeycloakProvider>
        </LinkContext.Provider>
    );
}

function parseCookies(req?: IncomingMessage) {
    return cookie.parse(req?.headers?.cookie || "");
}

MyApp.getInitialProps = async (context: AppContext) => {
    // Extract cookies from AppContext
    return {
        cookies: parseCookies(context?.ctx?.req),
    };
};

export default MyApp;

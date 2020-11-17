import cookie from "cookie";
import { AppProps, AppContext } from "next/app";
import { IncomingMessage } from "http";
import { SSRKeycloakProvider, SSRCookies } from "@react-keycloak/ssr";

// Blueprint required CSS
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import "../styles/globals.css";

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
        <SSRKeycloakProvider
            keycloakConfig={keycloakConfig}
            persistor={SSRCookies(cookies)}
        >
            <Component {...pageProps} />
        </SSRKeycloakProvider>
    );
}

function parseCookies(req?: IncomingMessage) {
    if (!req || !req.headers) {
        return {};
    }
    return cookie.parse(req.headers.cookie || "");
}

MyApp.getInitialProps = async (context: AppContext) => {
    // Extract cookies from AppContext
    return {
        cookies: parseCookies(context?.ctx?.req),
    };
};

export default MyApp;

import React, { ReactNode } from "react";
import cookie from "cookie";
import { AppProps, AppContext } from "next/app";
import getConfig from "next/config";
import { IncomingMessage } from "http";
import { SSRKeycloakProvider, SSRCookies } from "@react-keycloak/ssr";
import { buildThemeWrapper } from "@ecocommons-australia/ui-library";
import { ECMapVisualiserRequest } from "@ecocommons-australia/visualiser-client-geospatial";
import { getKeycloakAuthParameters, IS_BSC } from "../util/env";
import * as gtag from "../util/gtag";

// Blueprint required CSS
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import "@ecocommons-australia/ui-library/src/styles/global.css";

import "ol/ol.css";
import { useEffect } from "react";
import router from "next/router";

import { theme } from "../themes/default/theme";
import { theme as bscTheme } from "@ecocommons-australia/bsc-theme";

import "../themes/default/styles/global.css";
import "@ecocommons-australia/bsc-theme/styles/global.css";

const config = getConfig();

// Set the visualiser backend server URL
ECMapVisualiserRequest.MAP_VISUALISER_BACKEND_SERVER_URL =
    config.publicRuntimeConfig
        .NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL ??
    "#";

// Build ThemeWrapper component once, to be used inside the root component
const ThemeWrapper = buildThemeWrapper(IS_BSC
        ? bscTheme 
        : theme);

interface Props extends AppProps {
    /** Cookies in request */
    cookies: unknown;
}

function SafeHydrate({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps, cookies }: Props) {
    /** react-keycloak configuration */
    const keycloakConfig = getKeycloakAuthParameters();

    // Google analytices for the tracking page view.
    useEffect(() => {
        const handleRouteChange = (url: URL) => {
          gtag.pageview(url);
        };
        router.events.on("routeChangeComplete", handleRouteChange);
        return () => {
          router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, []);

    return (
        <SafeHydrate>
            <SSRKeycloakProvider
                keycloakConfig={keycloakConfig}
                persistor={SSRCookies(cookies)}
                initOptions={{ checkLoginIframe: false }}
            >
            <ThemeWrapper>
                <Component {...pageProps} />
            </ThemeWrapper>
            </SSRKeycloakProvider>
        </SafeHydrate>
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

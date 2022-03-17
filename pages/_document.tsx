import Document, { Html, Head, Main, NextScript } from "next/document";
import { GA_TRACKING_ID } from "../util/gtag";

class EcoCommonsDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <script
                        async
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
          `
                        }}
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                    <script
                        dangerouslySetInnerHTML={{
                            // Usersnap script
                            __html: `
                                window.onUsersnapCXLoad = function(api) {
                                    api.init();
                                }
                                var script = document.createElement("script");
                                script.defer = 1;
                                script.src = "https://widget.usersnap.com/global/load/e319db49-0f98-4f2d-8c43-2e847dfeadbe?onload=onUsersnapCXLoad";
                                document.getElementsByTagName("head")[0].appendChild(script);`,
                        }}
                    />
                </body>
            </Html>
        );
    }
}

export default EcoCommonsDocument;

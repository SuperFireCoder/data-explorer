import Document, { Html, Head, Main, NextScript } from "next/document";

class EcoCommonsDocument extends Document {
    render() {
        return (
            <Html>
                <Head />
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

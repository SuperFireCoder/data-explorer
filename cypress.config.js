const { defineConfig } = require("cypress");
const { loadEnvConfig } = require("@next/env");
// https://github.com/bahmutov/cypress-split
const cypressSplit = require("cypress-split");

// Allow local test runs to read .env.development
const DEV = process.env.NEXT_LOAD_ENV_CONFIG_DEV == 0 ? false : true;

console.info("loadEnvConfig() DEV ===", DEV);

// map NEXT_PUBLIC_* to Cypress.env()
const nextPublicEnv = Object.fromEntries(
    Object.entries(loadEnvConfig(process.cwd(), DEV).combinedEnv).filter(
        ([key]) => key.startsWith("NEXT_PUBLIC_")
    )
);

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        excludeSpecPattern: ["**/examples/*.spec.js"],
        chromeWebSecurity: false,
        trashAssetsBeforeRuns: true,
        requestTimeout: 20000,
        defaultCommandTimeout: 20000,
        video: false,
        scrollBehavior: "nearest",
        viewportWidth: 1200,
        viewportHeight: 1000,
        setupNodeEvents(on, config) {
            cypressSplit(on, config);
            return config;
        }
    },
    env: {
        ...nextPublicEnv
    }
});

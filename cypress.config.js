const { defineConfig } = require("cypress");
const { loadEnvConfig } = require("@next/env");

// map NEXT_PUBLIC_* to Cypress.env()
const nextPublicEnv = Object.fromEntries(
    Object.entries(loadEnvConfig(process.cwd(), true).combinedEnv).filter(
        ([key]) => key.startsWith('NEXT_PUBLIC_')
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
            require('@cypress/code-coverage/task')(on, config)
            require('cypress-split')(on, config)
            return config;
        }
    },
    env: {
        ...nextPublicEnv
    }
});

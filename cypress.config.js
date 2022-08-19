const { defineConfig } = require('cypress')
const { loadEnvConfig } = require('@next/env');

const USE_DEV_ENV = true;

// map NEXT_PUBLIC_* to Cypress.env()
const nextPublicEnv = Object.fromEntries(
    Object.entries(loadEnvConfig(process.cwd(), USE_DEV_ENV).combinedEnv).filter(
        ([key]) => key.startsWith('NEXT_PUBLIC_')
    )
);

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
	ignoreTestFiles: "**/examples/*.spec.js",
	experimentalSessionAndOrigin: false,
	chromeWebSecurity: false,
	trashAssetsBeforeRuns: true,
	requestTimeout: 10000,
	reporter: "cypress-sonarqube-reporter",
    reporterOptions: {
        overwrite: true
	},
	video: false,
	scrollBehavior: "nearest",
	viewportWidth: 1200,
	viewportHeight: 1000
  },
  env: {
  	...nextPublicEnv
  }
})
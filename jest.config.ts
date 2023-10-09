import type {Config} from 'jest';

// Packages with ES modules that need to be transpiled to be runnable within Node
const esModules = [
    "ol",
    "@ecocommons-australia/visualiser-client-geospatial"
].join("|");

const config: Config = {
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
        "<rootDir>/.next/", 
        "<rootDir>/node_modules/", 
        "<rootDir>/cypress/",
        "<rootDir>/tests/pages/", // ESM issues
        "<rootDir>/tests/components/DatasetCard.test.tsx" // ESM issues
        ],
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
    },
    coveragePathIgnorePatterns: [
        "/node_modules/",
        ".+\\.(css|styl|less|sass|scss)$",
    ],
    transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
    //coverageReporters: ["test-summary"],
    collectCoverage: true,
};

export default config;
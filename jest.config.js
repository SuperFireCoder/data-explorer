// Packages with ES modules that need to be transpiled to be runnable within Node
const esModules = ["ol"].join("|");

module.exports = {
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/cypress/"],
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/babel-jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
    },
    coveragePathIgnorePatterns: [
        "/node_modules/",
        ".+\\.(css|styl|less|sass|scss)$",
    ],
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
    coverageReporters: ["test-summary"],
    collectCoverage: true
};

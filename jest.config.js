module.exports = {
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/babel-jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
    },
    coveragePathIgnorePatterns: [
        "/node_modules/",
        ".+\\.(css|styl|less|sass|scss)$",
    ],
};

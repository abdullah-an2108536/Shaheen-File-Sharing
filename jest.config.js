// jest.config.js

module.exports = {
    projects: [
        {
            setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
            displayName: "client",
            testEnvironment: "jest-environment-jsdom",
            moduleNameMapper: {
                "\\.(css|less|scss|sass)$": "identity-obj-proxy",
                "^@/(.*)$": "<rootDir>/$1",
            },
            testMatch: ["**/__tests__/**/*.(test|spec).[jt]s?(x)"],
            transform: {
                "^.+\\.[jt]sx?$": [
                    "babel-jest",
                    {
                        presets: ["next/babel"],
                    },
                ],
            },
        },
        {
            displayName: "api",
            testEnvironment: "jest-environment-node",
            testMatch: ["**/__tests__/api/**/*.(test|spec).[jt]s?(x)"],
            transform: {
                "^.+\\.[jt]sx?$": [
                    "babel-jest",
                    {
                        presets: ["next/babel"],
                    },
                ],
            },
        },
    ],
};

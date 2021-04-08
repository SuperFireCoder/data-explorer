import { act, render, screen } from "@testing-library/react";
import MetadataView from "../../components/MetadataView";
import mockAxios from "jest-mock-axios";

import * as keycloakUtil from "../../util/keycloak";

// Mock Keycloak
const defaultKeycloakInfo = {
    keycloak: {
        authenticated: false,
    },
    initialized: false,
};

jest.mock("../../util/keycloak", () => ({
    useKeycloakInfo: jest.fn(() => defaultKeycloakInfo),
}));

// Mock environment utils
jest.mock("../../util/env", () => ({
    getDataExplorerBackendServerUrl: () => "http://test.backend.example.com",
}));

afterEach(() => {
    // Reset mocks
    keycloakUtil.useKeycloakInfo
        .mockReset()
        .mockImplementation(() => defaultKeycloakInfo);
    mockAxios.reset();
});

describe("MetadataView", () => {
    it("starts with a 'please wait' message", () => {
        render(<MetadataView datasetId="test-dataset-id" />);

        expect(
            screen.getByText("Please wait while we fetch this dataset", {
                exact: false,
            })
        ).toBeTruthy();
    });

    it("requests metadata info from backend on mount", () => {
        render(<MetadataView datasetId="test-dataset-id" />);

        expect(mockAxios.get).toBeCalledTimes(1);
        expect(mockAxios.get.mock.calls[0][0]).toBe(
            "http://test.backend.example.com/api/dataset/test-dataset-id"
        );
    });

    it("renders metadata from server", async () => {
        render(<MetadataView datasetId="test-dataset-id" />);

        await act(async () => {
            mockAxios.mockResponse({
                data: {
                    "bccvl:metadata": {
                        scientificName: ["Panthera leo"],
                        resolution: "Really fine",
                        domain: "The mighty jungle",
                        genre: "Mbube",
                        categories: ["biological", "occurrence"],
                        doi: "10.0000/0000000000",
                        attributions: [
                            {
                                type: "Citation",
                                value: "The Lion Sleeps Tonight",
                            },
                        ],
                        license: "Public Domain",
                    },
                    rangeAlternates: {},
                },
            });

            // Arbitrarily wait for all Promises to complete for state change to
            // be applied as a result of axios XHR above
            await Promise.resolve();
        });

        expect(screen.getByTestId("metadata-view")).toMatchSnapshot();
    });

    it("renders error when XHR fails", async () => {
        render(<MetadataView datasetId="test-dataset-id" />);

        await act(async () => {
            mockAxios.mockError(new Error("HTTP 404 Not Found"));

            // Arbitrarily wait for all Promises to complete for state change to
            // be applied as a result of axios XHR above
            await Promise.resolve();
        });

        expect(
            screen.getByText("An error occurred when fetching this dataset", {
                exact: false,
            })
        ).toBeTruthy();
    });

    it("requests metadata info from backend on mount", () => {
        // Mock keycloak
        const keycloakInfo = {
            ...defaultKeycloakInfo,
            keycloak: {
                authenticated: true,
                token: "TEST_KEYCLOAK_TOKEN_USUALLY_BASE64_ENCODED",
            },
        };

        jest.spyOn(keycloakUtil, "useKeycloakInfo").mockImplementation(
            () => keycloakInfo
        );

        render(<MetadataView datasetId="test-dataset-id" />);

        expect(mockAxios.get.mock.calls[0][1]).toHaveProperty(
            ["headers", "Authorization"],
            "Bearer TEST_KEYCLOAK_TOKEN_USUALLY_BASE64_ENCODED"
        );
    });
});

import { render, screen, act, findAllByTestId } from "@testing-library/react";
import IndexPage from "../../pages/index";
import mockAxios from "jest-mock-axios";

import * as keycloakUtil from "../../util/keycloak";
import * as nextRouter from "next/router";

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

// Mock Next router
const defaultNextUseRouter = {
    route: "/",
    pathname: "",
    query: {},
    asPath: "",
};

jest.mock("next/router", () => ({
    useRouter: jest.fn(() => defaultNextUseRouter),
}));

afterEach(() => {
    // Reset mocks
    keycloakUtil.useKeycloakInfo
        .mockReset()
        .mockImplementation(() => defaultKeycloakInfo);
    nextRouter.useRouter
        .mockReset()
        .mockImplementation(() => defaultNextUseRouter);
    mockAxios.reset();
});

describe("IndexPage", () => {
    it("renders dataset info from Elasticsearch query", async () => {
        render(<IndexPage />);

        expect(mockAxios.post).toHaveBeenCalledTimes(1);

        await act(async () => {
            mockAxios.mockResponse({
                data: {
                    hits: {
                        total: {
                            value: 3,
                        },
                        hits: [
                            {
                                _id: "1",
                                _source: {
                                    title: "Test title 1",
                                    description: "Test description 1",
                                    scientific_type: ["type", "1"],
                                },
                            },
                            {
                                _id: "2",
                                _source: {
                                    title: "Test title 2",
                                    description: "Test description 2",
                                    scientific_type: ["type", "2"],
                                },
                            },
                            {
                                _id: "3",
                                _source: {
                                    title: "Test title 3",
                                    description: "Test description 3",
                                    scientific_type: ["type", "3"],
                                },
                            },
                        ],
                    },
                },
            });

            // Arbitrarily wait for all Promises to complete for state change to
            // be applied as a result of axios XHR above
            await Promise.resolve();
        });

        // Once all results come back

        expect(await screen.findByTestId("results-count")).toHaveTextContent(
            "3 results"
        );
        expect(await screen.findByText("Test title 1")).toBeTruthy();
        expect(await screen.findByText("Test title 2")).toBeTruthy();
        expect(await screen.findByText("Test title 3")).toBeTruthy();
    });

    it("renders correct pagination buttons for more than 1 page", async () => {
        // Mock this page's query page size and start index
        const thisPageRouter = {
            ...defaultNextUseRouter,
            query: {
                pageSize: 10,
                pageStart: 10,
            },
        };

        jest.spyOn(nextRouter, "useRouter").mockImplementation(
            () => thisPageRouter
        );

        render(<IndexPage />);

        await act(async () => {
            mockAxios.mockResponse({
                data: {
                    hits: {
                        total: {
                            value: 25,
                        },
                        hits: [],
                    },
                },
            });

            // Arbitrarily wait for all Promises to complete for state change to
            // be applied as a result of axios XHR above
            await Promise.resolve();
        });

        // Once all results come back

        const paginationButtons = await findAllByTestId(
            await screen.findByTestId("pagination-buttons"),
            "pagination-button"
        );

        // 3 buttons
        expect(paginationButtons.length).toBe(3);
        // Only middle one is highlighted as `primary` due to page start = 10
        expect(paginationButtons[0].className).not.toMatch(
            "bp3-intent-primary"
        );
        expect(paginationButtons[1].className).toMatch("bp3-intent-primary");
        expect(paginationButtons[2].className).not.toMatch(
            "bp3-intent-primary"
        );
    });

    it("provides Authorization header with current session's token when signed in", async () => {
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

        render(<IndexPage />);

        expect(mockAxios.post).toHaveBeenCalledTimes(1);

        expect(mockAxios.post.mock.calls[0][2]).toHaveProperty(
            ["headers", "Authorization"],
            "Bearer TEST_KEYCLOAK_TOKEN_USUALLY_BASE64_ENCODED"
        );
    });
});

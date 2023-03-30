import {
    render,
    screen,
    act,
    findAllByTestId,
    fireEvent,
    getByText,
    getByRole,
    waitFor,
} from "@testing-library/react";
import IndexPage from "../../pages/index";
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
    useKeycloakInfo: jest.fn(),
}));

// Mock Next router
jest.mock("next/router", () => require("next-router-mock"));

// Convenience function to get router mock directly
const getRouterMock = () => require("next-router-mock").default;

const resolveXhr = async (xhrResponse) => {
    await act(async () => {
        mockAxios.mockResponse(xhrResponse);

        // Arbitrarily wait for all Promises to complete for state change to
        // be applied as a result of axios XHR above
        await Promise.resolve();
    });
};

// Convenience function to load page initially with no content
// Note that the page itself loads XHR once on mount
const renderPage = async (initialMockXhrResponse) => {
    render(<IndexPage />);

    // Clear queued up initial XHR

    // Aggregation occurs on mount
    await resolveXhr(
        initialMockXhrResponse || {
            data: {
                hits: {
                    total: {
                        value: 0,
                    },
                    hits: [],
                },
            },
        }
    );

    // Query
    await resolveXhr(
        initialMockXhrResponse || {
            data: {
                hits: {
                    total: {
                        value: 0,
                    },
                    hits: [],
                },
            },
        }
    );
};

beforeEach(() => {
    // Reset mocks
    keycloakUtil.useKeycloakInfo
        .mockReset()
        .mockImplementation(() => defaultKeycloakInfo);
    // Reset router by setting path to root, which should wipe any query params
    getRouterMock().replace("/");
    mockAxios.reset();
});

describe("IndexPage", () => {
    it("renders dataset info from Elasticsearch query", async () => {
        await renderPage({
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

        // 1 for query, 1 for aggregations
        expect(mockAxios.post).toHaveBeenCalledTimes(3);

        // Once all results come back

        expect(await screen.findByTestId("results-count")).toHaveTextContent(
            "3 results"
        );
        expect(await screen.findByText("Test title 1")).toBeTruthy();
        expect(await screen.findByText("Test title 2")).toBeTruthy();
        expect(await screen.findByText("Test title 3")).toBeTruthy();
    });

    it("renders correct pagination buttons for more than 1 page", async () => {
        const router = getRouterMock();

        await renderPage();

        // Set this page's query page size and start index
        act(() => {
            router.push({
                query: {
                    pageSize: 10,
                    pageStart: 10,
                },
            });
        });

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

        await renderPage();

        // 1 for query, 1 for aggregations
        expect(mockAxios.post).toHaveBeenCalledTimes(3);

        expect(mockAxios.post.mock.calls[0][2]).toHaveProperty(
            ["headers", "Authorization"],
            "Bearer TEST_KEYCLOAK_TOKEN_USUALLY_BASE64_ENCODED"
        );

        expect(mockAxios.post.mock.calls[1][2]).toHaveProperty(
            ["headers", "Authorization"],
            "Bearer TEST_KEYCLOAK_TOKEN_USUALLY_BASE64_ENCODED"
        );
    });

    it("captures value of free-text search field into Elasticsearch query", async () => {
        await renderPage();

        // Fill in text into search field
        act(() => {
            fireEvent.change(screen.getByTestId("search-field"), {
                target: { value: "Some test search value" },
            });
        });

        // Fire new query by hitting ENTER to trigger submit
        act(() => {
            fireEvent.submit(screen.getByTestId("search-field"));
        });

        await resolveXhr({
            data: {
                hits: {
                    total: {
                        value: 0,
                    },
                    hits: [],
                },
            },
        });

        // 4th POST due to new query should have the text we filled into the
        // search field
        expect(mockAxios.post).toBeCalledTimes(4);
        expect(mockAxios.post.mock.calls[3][1]).toMatchObject({
            query: {
                bool: {
                    "must": [
                        {
                            "bool": {
                                should: [
                                    { match: { title: "Some test search value" } },
                                    { match: { description: "Some test search value" } },
                                    { wildcard: { title: "*Some test search value*" } },
                                    { wildcard: { description: "*Some test search value*" } },
                                ]
                            }
                        },
                        {
                            bool: {
                                should: [{ match: { time_domain: "Current" } }],
                            },
                        },
                        {
                            bool: {
                                should: [{ match: { month: "Non monthly data" }}],
                            },
                        },
                    ]

                }
            },
        });
    });

    it("captures value of free-text search into router", async () => {
        const router = getRouterMock();

        await renderPage();

        // Fill in text into search field
        act(() => {
            fireEvent.change(screen.getByTestId("search-field"), {
                target: { value: "Some test search value" },
            });
        });

        // Fire new query by hitting ENTER to trigger submit
        act(() => {
            fireEvent.submit(screen.getByTestId("search-field"));
        });

        await resolveXhr({
            data: {
                hits: {
                    total: {
                        value: 0,
                    },
                    hits: [],
                },
            },
        });

        expect(router.query).toMatchObject({
            searchQuery: "Some test search value",
        });
    });

    it("captures values of facets into Elasticsearch query", async () => {
        // Supply some facets
        await renderPage({
            data: {
                hits: {
                    total: {
                        value: 0,
                    },
                    hits: [],
                },
                aggregations: {
                    facetGcm: {
                        doc_count_error_upper_bound: 0,
                        sum_other_doc_count: 0,
                        buckets: [
                            { key: "ECHAM5", doc_count: 44 },
                            { key: "GFDL-CM2.0", doc_count: 44 },
                            { key: "GFDL-CM2.1", doc_count: 44 },
                            { key: "MIROC3.2-MEDRES", doc_count: 44 },
                            { key: "UKMO-HADCM3", doc_count: 44 },
                            { key: "CSIRO-MK3.0", doc_count: 2 },
                            { key: "MIROC-H", doc_count: 2 },
                        ],
                    },
                    facetSpatialDomain: {
                        doc_count_error_upper_bound: 0,
                        sum_other_doc_count: 0,
                        buckets: [
                            { key: "Regional", doc_count: 228 },
                            { key: "Australia", doc_count: 38 },
                            { key: "Global", doc_count: 8 },
                        ],
                    },
                    facetTimeDomain: {
                        doc_count_error_upper_bound: 0,
                        sum_other_doc_count: 0,
                        buckets: [
                            { key: "Current", doc_count: 228 },
                            { key: "Future", doc_count: 38 },
                        ],
                    },
                    facetMonth: {
                        doc_count_error_upper_bound: 0,
                        sum_other_doc_count: 0,
                        buckets: [
                            { key: "Non Monthly", doc_count: 228 },
                            { key: "January", doc_count: 38 },
                            { key: "Febraury", doc_count: 8 },
                        ],
                    },
                },
            },
        });

        // Select a bunch of facets
        // Find GCM and spatial domain fields, and pick options
        const facetFields = screen.getByTestId("facet-fields");
        const gcmTextbox = getByRole(
            getByText(facetFields, "Global Circulation Models").parentElement!,
            "textbox"
        );
        const spatialDomainTextbox = getByRole(
            getByText(facetFields, "Spatial domain").parentElement!,
            "textbox"
        );

        // Select "MIROC3.2-MEDRES" in GCM
        act(() => {
            fireEvent.click(gcmTextbox);
        });

        await waitFor(() => screen.getByText("MIROC3.2-MEDRES"));

        await act(async () => {
            fireEvent.click(screen.getByText("MIROC3.2-MEDRES"));
            await Promise.resolve();
        });

        // Select "Australia" and "Regional" in spatial domain
        act(() => {
            fireEvent.click(spatialDomainTextbox);
        });

        await waitFor(() => screen.getByText("Regional"));

        await act(async () => {
            fireEvent.click(screen.getByText("Regional"));
            await Promise.resolve();
        });

        await act(async () => {
            fireEvent.click(screen.getByText("Australia"));
            await Promise.resolve();
        });

        // Note that every time we select a facet, a new POST is called
        expect(mockAxios.post).toBeCalledTimes(6);
        expect(mockAxios.post.mock.calls[5][1]).toMatchObject({
            query: {
                bool: {
                    must: [
                        {
                            bool: {
                                should: [{ match: { time_domain: "Current", } }],
                            },
                        },
                        {

                            bool: {
                                should: [
                                    { match: { spatial_domain: "Regional" } },
                                    { match: { spatial_domain: "Australia" } },
                                ],
                            },
                        },
                        {
                            bool: {
                                should: [{ match: { gcm: "MIROC3.2-MEDRES" } }],
                            },
                        },
                        {
                            bool: {
                                should: [{ match: { month: "Non monthly data", } }],
                            },
                        },

                    ],
                },
            },
        });
    });
});

import { render } from "@testing-library/react";
import IndexPage from "../../pages/index";
import * as keycloakUtil from "../../util/keycloak";

// Mock Keycloak
jest.mock("../../util/keycloak", () => ({
    // Default is to provide empty user information
    useKeycloakInfo: jest.fn(() => ({ keycloak: {}, initialized: false })),
}));

describe("IndexPage", () => {
    it("renders without crashing", () => {
        render(<IndexPage />);
    });

    it("renders welcome without other user info when not signed in", () => {
        const indexPage = render(<IndexPage />);
        expect(indexPage.queryByTestId("welcome-user")?.textContent).toBe(
            "Welcome"
        );
    });

    it("renders welcome with user's name when signed in", () => {
        // Pretend we've got a user signed in
        const kcMock = keycloakUtil.useKeycloakInfo.mockImplementation(() => ({
            keycloak: {
                tokenParsed: {
                    name: "Test user",
                },
            },
        }));

        const indexPage = render(<IndexPage />);
        expect(indexPage.queryByTestId("welcome-user")?.textContent).toBe(
            "Welcome, Test user"
        );

        // Restore mock
        kcMock.mockRestore();
    });
});

import { render } from "@testing-library/react";
import IndexPage from "../../pages/index";
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
        const signedInKeycloakInfo = {
            keycloak: {
                tokenParsed: {
                    name: "Test user",
                },
            },
        };
        const kcMock = keycloakUtil.useKeycloakInfo.mockImplementation(
            () => signedInKeycloakInfo
        );

        const indexPage = render(<IndexPage />);
        expect(indexPage.queryByTestId("welcome-user")?.textContent).toBe(
            "Welcome, Test user"
        );

        // Restore mock
        kcMock.mockRestore();
    });
});

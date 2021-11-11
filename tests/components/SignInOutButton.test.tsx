import { render } from "@testing-library/react";
import SignInOutButton from "../../components/SignInOutButton";
import * as keycloakUtil from "../../util/keycloak";

// Mock router and Keycloak
const defaultKeycloakInfo = {
    keycloak: {
        authenticated: false,
    },
    initialized: false,
};

jest.mock("next/router", () => ({ useRouter: () => {} }));
jest.mock("../../util/keycloak", () => ({
    useKeycloakInfo: jest.fn(() => defaultKeycloakInfo),
}));

afterEach(() => {
    // Reset mocks
    keycloakUtil.useKeycloakInfo
        .mockReset()
        .mockImplementation(() => defaultKeycloakInfo);
});

describe("SignInOutButton", () => {
    it("renders correct state when signed out", () => {
        const button = render(<SignInOutButton />);
        expect(button.container.textContent).toBe("Sign in / Register");
    });

    it("renders correct state when signed in", () => {
        // Mock Keycloak
        const signInKeycloakInfo = {
            keycloak: {
                authenticated: true,
                tokenParsed: {
                    given_name: "TEST_GIVEN_NAME",
                },
            },
            initialized: true,
        };
        const kcMock = keycloakUtil.useKeycloakInfo.mockImplementation(
            () => signInKeycloakInfo
        );

        const button = render(<SignInOutButton />);
        expect(button.container.textContent).toBe(
            "userTEST_GIVEN_NAMEcaret-down"
        );

        // Restore mock
        kcMock.mockRestore();
    });
});

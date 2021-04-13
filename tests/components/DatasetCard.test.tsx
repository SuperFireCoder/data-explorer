import { act, render, screen, waitFor } from "@testing-library/react";
import DatasetCard from "../../components/DatasetCard";

describe("DatasetCard", () => {
    it("displays date information, where provided, in the expected format", () => {
        render(
            <DatasetCard
                title=""
                description=""
                lastUpdated={new Date("2021-05-21")}
            />
        );

        expect(screen.getByTestId("last-updated-date")).toHaveTextContent(
            "Updated: 21 May 2021"
        );
    });

    it("displays the dataset 'type'", () => {
        render(
            <DatasetCard
                title=""
                description=""
                type={{ type: "environmental", subtype: "climate" }}
            />
        );

        expect(screen.getByTestId("type")).toHaveTextContent(
            "environmentalclimate"
        );
    });

    it("opens metadata drawer when Info button clicked on", () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
            />
        );

        // Check that drawer is not open at the beginning
        expect(screen.queryByTestId("metadata-drawer")).toBeFalsy();

        // Click on Info button to open metadata drawer
        act(() => screen.getByTestId("info-button").click());

        // Check that drawer is now open
        expect(screen.queryByTestId("metadata-drawer")).toBeTruthy();
    });

    it("closes metadata drawer when drawer close button clicked", async () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
            />
        );

        // Open metadata drawer first
        act(() => screen.getByTestId("info-button").click());

        // Click the close button
        act(() =>
            screen
                .getAllByRole("button")
                .find((el) => el.getAttribute("aria-label") === "Close")
                ?.click()
        );

        // Drawer should be closed
        // Note that because of animations, the element doesn't disappear
        // immediately
        await waitFor(() =>
            expect(screen.queryByTestId("metadata-drawer")).toBeFalsy()
        );
    });

    it("opens visualiser drawer when View button clicked on", () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
            />
        );

        // Check that drawer is not open at the beginning
        expect(screen.queryByTestId("visualiser-drawer")).toBeFalsy();

        // Click on Info button to open visualiser drawer
        act(() => screen.getByTestId("view-button").click());

        // Check that drawer is now open
        expect(screen.queryByTestId("visualiser-drawer")).toBeTruthy();
    });

    it("closes visualiser drawer when drawer close button clicked", async () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
            />
        );

        // Open visualiser drawer first
        act(() => screen.getByTestId("view-button").click());

        // Click the close button
        act(() =>
            screen
                .getAllByRole("button")
                .find((el) => el.getAttribute("aria-label") === "Close")
                ?.click()
        );

        // Drawer should be closed
        // Note that because of animations, the element doesn't disappear
        // immediately
        await waitFor(() =>
            expect(screen.queryByTestId("visualiser-drawer")).toBeFalsy()
        );
    });
});

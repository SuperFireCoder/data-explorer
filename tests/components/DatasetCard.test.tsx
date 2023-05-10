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
                status="SUCCESS"
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
                status="SUCCESS"
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
                status="SUCCESS"
                exploreDataType="dataExplorer"
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
                exploreDataType="dataExplorer"
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

    it("displays the title and description when provided", () => {
        render(
            <DatasetCard
                title="Test dataset"
                description="This is a test dataset"
                lastUpdated={new Date("2021-05-21")}
            />
        );
    
        expect(screen.getByTestId("dataset-card")).toHaveTextContent(
            "Test datasetThis is a test dataset"
        );
    });
    it("displays the title and description when provided", () => {
        render(
            <DatasetCard
                title="Test dataset"
                description="This is a test dataset"
                lastUpdated={new Date("2021-05-21")}
            />
        );
    
        expect(screen.getByTestId("dataset-card")).toHaveTextContent(
            "Test datasetThis is a test dataset"
        );
    });
    it("displays 'Unknown' for last updated date when not provided", () => {
        render(
            <DatasetCard
                title=""
                description=""
            />
        );
    
        expect(screen.getByTestId("last-updated-date")).toHaveTextContent(
            "Updated: Unknown"
        );
    });
    it("displays the correct status icon based on the 'status' prop", () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                status="SUCCESS"
            />
        );
    
        expect(screen.getByTestId("status-icon")).toHaveAttribute("src", "/success-icon.svg");
    
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                status="FAILED"
            />
        );
    
        expect(screen.getByTestId("status-icon")).toHaveAttribute("src", "/failed-icon.svg");
    });
    it("displays the correct status icon based on the 'status' prop", () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                status="SUCCESS"
            />
        );
    
        expect(screen.getByTestId("status-icon")).toHaveAttribute("src", "/success-icon.svg");
    
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                status="FAILED"
            />
        );
    
        expect(screen.getByTestId("status-icon")).toHaveAttribute("src", "/failed-icon.svg");
    });
    it("displays the correct explore data type icon based on the 'exploreDataType' prop", () => {
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                exploreDataType="dataExplorer"
            />
        );
    
        expect(screen.getByTestId("explore-data-type-icon")).toHaveAttribute("src", "/data-explorer-icon.svg");
    
        render(
            <DatasetCard
                datasetId="test-dataset-id"
                title="Test dataset ID"
                description=""
                exploreDataType="chartBuilder"
            />
        );
    
        expect(screen.getByTestId("explore-data-type-icon")).toHaveAttribute("src", "/chart-builder-icon.svg");
    });
     
});

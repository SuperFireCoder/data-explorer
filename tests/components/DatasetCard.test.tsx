import { render, screen } from "@testing-library/react";
import DatasetCard from "../../components/DatasetCard";

describe("DatasetCard", () => {
    it("displays date information, where provided, in the expected format", async () => {
        render(
            <DatasetCard
                title=""
                description=""
                lastUpdated={new Date("2021-05-21")}
            />
        );

        expect(
            await screen.findByTestId("last-updated-date")
        ).toHaveTextContent("Updated: 21 May 2021");
    });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatasetCardKN from "./../../components/DatasetCardKN";

describe("DatasetCardKN", () => {
  const props = {
    datasetId: "123",
    title: "Test Dataset",
    description: "This is a test dataset",
    type: "table",
    lastUpdated: new Date("2022-05-09T12:30:00Z"),
    landingPageUrl: "https://example.com",
    distributions: [
      {
        url: "https://example.com/data.csv",
        format: "csv",
        size: 1024,
      },
    ],
  };

  test("renders the component with all props", () => {
    render(<DatasetCardKN {...props} />);

    expect(screen.getByText("Test Dataset")).toBeInTheDocument();
    expect(screen.getByText("This is a test dataset")).toBeInTheDocument();
    expect(screen.getByTestId("type")).toHaveTextContent("Table");
    expect(screen.getByTestId("last-updated-date")).toHaveTextContent(
      "Updated: 09 May 2022"
    );
    expect(screen.getByTestId("view-button")).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(screen.getByTestId("view-button")).not.toBeDisabled();
    expect(screen.getByTestId("info-button")).toBeInTheDocument();
    expect(screen.getByText("Get Data")).toBeInTheDocument();
    expect(screen.getByText("csv")).toBeInTheDocument();
    expect(screen.getByText("1 KB")).toBeInTheDocument();
  });

  test("opens metadata drawer when info button is clicked", () => {
    render(<DatasetCardKN {...props} />);

    expect(screen.queryByText("Metadata Drawer")).not.toBeInTheDocument();

    userEvent.click(screen.getByTestId("info-button"));

    expect(screen.getByText("Metadata Drawer")).toBeInTheDocument();
  });

  test("opens get data drawer when get data button is clicked", () => {
    render(<DatasetCardKN {...props} />);

    expect(screen.queryByText("Get Data Drawer")).not.toBeInTheDocument();

    userEvent.click(screen.getByText("Get Data"));

    expect(screen.getByText("Get Data Drawer")).toBeInTheDocument();
  });

  test("disables view button when landing page URL is undefined", () => {
    render(<DatasetCardKN {...props} landingPageUrl={undefined} />);

    expect(screen.getByTestId("view-button")).toBeDisabled();
  });

  test("does not show type or last updated date if they are not provided", () => {
    render(<DatasetCardKN {...props} type={undefined} lastUpdated={undefined} />);

    expect(screen.queryByTestId("type")).not.toBeInTheDocument();
    expect(screen.queryByTestId("last-updated-date")).not.toBeInTheDocument();
  });
});

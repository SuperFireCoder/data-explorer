import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import DatasetSharingAddUserButton from "./../../components/DatasetSharingAddUserButton";

describe("DatasetSharingAddUserButton", () => {
  it("should render the component with a disabled button", () => {
    const { getByText } = render(<DatasetSharingAddUserButton disabled />);
    const button = getByText("Add user");
    expect(button).toBeDisabled();
  });
})

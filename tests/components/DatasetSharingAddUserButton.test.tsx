import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import DatasetSharingAddUserButton from "./../../components/DatasetSharingAddUserButton";

describe("DatasetSharingAddUserButton", () => {
  it("should render the component with a disabled button", () => {
    const { getByText } = render(<DatasetSharingAddUserButton disabled />);
    const button = getByText("Add user");
    expect(button).toBeDisabled();
  });

  it("should call onAddUser prop with user ID when form is submitted", async () => {
    const userId = "user-123";
    const userEmail = "user@example.com";
    const onAddUser = jest.fn();
    const lookupUserByEmail = jest.fn().mockResolvedValue([{ id: userId }]);

    const { getByPlaceholderText, getByText } = render(
      <DatasetSharingAddUserButton onAddUser={onAddUser} />
    );
    const button = getByText("Add user");
    fireEvent.click(button);

    const emailInput = getByPlaceholderText("user@example.com");
    fireEvent.change(emailInput, { target: { value: userEmail } });

    const submitButton = getByText("→");
    fireEvent.click(submitButton);

    expect(lookupUserByEmail).toHaveBeenCalledWith(userEmail.toLowerCase());
    await act(() => Promise.resolve()); // wait for the form submission to complete
    expect(onAddUser).toHaveBeenCalledWith(userId);
  });

  it("should show an error message when user email is not found", async () => {
    const userEmail = "user@example.com";
    const lookupUserByEmail = jest.fn().mockResolvedValue([]);

    const { getByPlaceholderText, getByText } = render(
      <DatasetSharingAddUserButton />
    );
    const button = getByText("Add user");
    fireEvent.click(button);

    const emailInput = getByPlaceholderText("user@example.com");
    fireEvent.change(emailInput, { target: { value: userEmail } });

    const submitButton = getByText("→");
    fireEvent.click(submitButton);

    expect(lookupUserByEmail).toHaveBeenCalledWith(userEmail.toLowerCase());

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import NumberInputGroup, { Props } from "./../../components/NumberInputGroup";

describe("NumberInputGroup", () => {
  const defaultProps: Props = {
    numberParseMode: "float",
    numberValue: null,
    onNumberValueChange: jest.fn(),
  };

  it("renders without crashing", () => {
    render(<NumberInputGroup {...defaultProps} />);
  });

  it("renders the input value correctly", () => {
    const { getByRole } = render(
      <NumberInputGroup {...defaultProps} numberValue={123.45} />
    );
    const input = getByRole("textbox");
    expect(input).toHaveValue("123.45");
  });

  it("calls onNumberValueChange when the input value changes", () => {
    const onNumberValueChange = jest.fn();
    const { getByRole } = render(
      <NumberInputGroup {...defaultProps} onNumberValueChange={onNumberValueChange} />
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "123.45" } });
    expect(onNumberValueChange).toHaveBeenCalledWith(123.45);
  });
})
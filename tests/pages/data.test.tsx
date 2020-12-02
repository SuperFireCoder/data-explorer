import { render } from "@testing-library/react";
import DataPage from "../../pages/data";

describe("DataPage", () => {
    it("renders without crashing", () => {
        render(<DataPage />);
    });
});

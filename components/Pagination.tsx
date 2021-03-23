import { Button, ButtonGroup } from "@blueprintjs/core";
import { ReactNode } from "react";

export interface Props {
    /** Current page index */
    currentIndex: number;
    /** Total number of pages */
    max: number;
    /** Handler on page select */
    onSelect?: (index: number) => void;
}

export default function Pagination({ currentIndex, max, onSelect }: Props) {
    const pageButtons: ReactNode[] = [];

    for (let i = 0; i < max; i++) {
        pageButtons.push(
            <Button
                key={i}
                onClick={onSelect ? () => onSelect(i) : undefined}
                intent={i === currentIndex ? "primary" : "none"}
                data-testid="pagination-button"
            >
                {i + 1}
            </Button>
        );
    }

    return <ButtonGroup>{pageButtons}</ButtonGroup>;
}

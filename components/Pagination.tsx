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

function PageButton({
    i,
    currentIndex,
    onSelect,
}: Omit<Props, "max"> & { i: number }) {
    return (
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

export default function Pagination({ currentIndex, max, onSelect }: Props) {
    const pageButtons: ReactNode[] = [];

    // For long pagination sequences, we use a clipped form
    if (max > 9) {
        // Set containing numbers and `null`, where `null` represents
        // intermediate "..." padding in pagination block
        const indicesToRender: (number | null)[] = [];

        // Always render first page
        indicesToRender.push(0);

        // Render two pages around current index and itself
        const lowerLocalBound = Math.max(currentIndex - 2, 1);
        const upperLocalBound = Math.min(currentIndex + 2, max - 2);

        // Add padding where the lower bound around the current index is greater
        // than the 1st page
        if (lowerLocalBound > 1) {
            indicesToRender.push(null);
        }

        for (let i = lowerLocalBound; i <= upperLocalBound; i++) {
            indicesToRender.push(i);
        }

        // Add padding where the upper bound around the current index is lower
        // than the last page
        if (upperLocalBound < max - 2) {
            indicesToRender.push(null);
        }

        // Always render final page
        indicesToRender.push(max - 1);

        // Generate the buttons
        indicesToRender.forEach((i, pos) =>
            i !== null
                ? pageButtons.push(
                      <PageButton
                          key={pos}
                          i={i}
                          currentIndex={currentIndex}
                          onSelect={onSelect}
                      />
                  )
                : pageButtons.push(
                      <Button key={pos} disabled intent="none">
                          ...
                      </Button>
                  )
        );
    } else {
        for (let i = 0; i < max; i++) {
            pageButtons.push(
                <PageButton
                    key={i}
                    i={i}
                    currentIndex={currentIndex}
                    onSelect={onSelect}
                />
            );
        }
    }

    return <ButtonGroup>{pageButtons}</ButtonGroup>;
}

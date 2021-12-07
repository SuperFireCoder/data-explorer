import { useCallback, useState } from "react";

/**
 * Hook to provide encapsulated control over a boolean flag used in "openable"
 * components (like a Drawer.)
 *
 * @param defaultOpen Sets open state on mount (defaults to false)
 */
export const useOpenableOpen = (defaultOpen: boolean = false) => {
    const [open, setOpen] = useState<boolean>(defaultOpen);
    const openCallback = useCallback(() => setOpen(true), []);
    const closeCallback = useCallback(() => setOpen(false), []);

    return {
        isOpen: open,
        setOpen,
        open: openCallback,
        close: closeCallback,
    };
};

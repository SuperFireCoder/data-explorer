import { useCallback, useState } from "react";

export const useEffectTrigger = () => {
    const [triggerValue, setTriggerValue] = useState<number>(0);

    const triggerEffect = useCallback(() => setTriggerValue((x) => x + 1), []);

    return {
        triggerEffect,
        triggerValue,
    };
};

import { useEffect, useRef } from "react";

export function useSafeTimeout() {
    const ids = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        return () => {
            ids.current.forEach(clearTimeout);
        };
    }, []);

    return (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            ids.current = ids.current.filter((i) => i !== id);
            fn();
        }, ms);
        ids.current.push(id);
        return id;
    };
}

import React from "react";
import { SyntheticEvent, useState } from "react";
import { Overlay, Spinner, SpinnerSize } from "@blueprintjs/core";

import styles from "./ExternalFrame.module.css";

export type UrlParams = Record<string, string | string[]>;

interface Props {
    src: string;
    title?: string;
    params?: UrlParams;
}

export function ExternalFrame({ src, title = "", params = {} }: Props) {
    const [isLoading, setIsLoading] = useState(true);

    const urlSearchParams = new URLSearchParams();

    for (const [name, val] of Object.entries(params)) {
        if (Array.isArray(val)) {
            val.map((v) => urlSearchParams.append(name, v || ""));
        } else {
            urlSearchParams.append(name, val || "");
        }
    }

    const StyleWrapperClasses = () => {
        const defaultMode = `${styles.externalFrame}`;
        return defaultMode;
    };

    function onload(event: SyntheticEvent<HTMLIFrameElement>): void {
        setIsLoading(false);
    }

    return (
        <div className={StyleWrapperClasses()}>
            <Overlay
                usePortal={false}
                isOpen={isLoading}
                canOutsideClickClose={true}
                className={styles.spinnerOverlay}
                backdropClassName={styles.spinnerOverlayBackdrop}
            >
                <Spinner className={styles.spinner} size={SpinnerSize.LARGE} />
            </Overlay>

            <iframe
                title={title}
                data-cy={title}
                allowFullScreen={true}
                className={styles.frame}
                src={
                    src +
                    (urlSearchParams.values()
                        ? "?" + urlSearchParams.toString()
                        : "")
                }
                onChange={() => setIsLoading(true)}
                onLoad={onload}
            ></iframe>
        </div>
    );
}

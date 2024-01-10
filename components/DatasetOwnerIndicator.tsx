import React from "react";

import styles from "./DatasetOwnerIndicator.module.css";

export interface Props {
    ownerLabel: string[];
}

export default function DatasetOwnerIndicator({ ownerLabel }: Props) {
    return (
        <span
            className={styles.indicator}
        >
            <span className={styles.label}>shared</span>
            <span className={styles.value}>{ownerLabel}</span>
        </span>
    );
}

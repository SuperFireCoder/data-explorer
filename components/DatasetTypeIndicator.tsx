import { DatasetType } from "../interfaces/DatasetType";

import styles from "./DatasetTypeIndicator.module.css";

export interface Props {
    type: DatasetType;
}

export default function DatasetTypeIndicator({ type }: Props) {
    return (
        <span
            className={styles.indicator}
            data-type={type.type}
            data-subtype={type.subtype}
        >
            <span className={styles.type}>{type.type}</span>
            <span className={styles.subtype}>{type.subtype}</span>
        </span>
    );
}

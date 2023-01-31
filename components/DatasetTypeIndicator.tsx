import { DatasetType } from "../interfaces/DatasetType";

import styles from "./DatasetTypeIndicator.module.css";

export interface Props {
    /** Dataset type object */
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
            {type.subtype && 
                <span className={styles.subtype}>{type.subtype}</span>
            }
        </span>
    );
}

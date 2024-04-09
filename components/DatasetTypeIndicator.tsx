import React from "react";
import { DatasetType } from "../interfaces/DatasetType";

import styles from "./DatasetTypeIndicator.module.css";

export interface Props {
    /** Dataset type object */
    type: DatasetType | string[];
}

export default function DatasetTypeIndicator({ type }: Props) {
    if (Array.isArray(type) && type.length > 0){
        return (
            <span
                className={styles.indicator}
                data-type={type[0]}
                data-subtype={type.length > 0 && type[1]}
            >
                {type.map((t, i) => <span key={i} className={styles['type'+i]}>{t}</span>)}
            </span>
        );
    }

    const dsType = (type as DatasetType);
    if (dsType.type){
        return (
            <span
                className={styles.indicator}
                data-type={dsType.type}
                data-subtype={dsType.subtype}
            >
                <span className={styles.type}>{dsType.type}</span>
                {dsType.subtype && 
                    <span className={styles.subtype}>{dsType.subtype}</span>
                }
            </span>
        );
    }
    return null;
}

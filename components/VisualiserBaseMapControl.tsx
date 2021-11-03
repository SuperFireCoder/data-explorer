import { Radio, RadioGroup } from "@blueprintjs/core";
import { MapLayer } from "@ecocommons-australia/visualiser-client-geospatial";
import classnames from "classnames";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

import styles from "./VisualiserBaseMapControl.module.css";

export interface Props {
    baseMaps: readonly MapLayer[];
    currentBaseMap: MapLayer;
    onCurrentBaseMapChange: (baseMap: MapLayer) => void;
}

export default function VisualiserBaseMapControl({
    baseMaps,
    currentBaseMap,
    onCurrentBaseMapChange,
}: Props) {
    const [optionsVisible, setOptionsVisible] = useState<boolean>(false);

    const sortedBaseMaps = useMemo(
        () => [...baseMaps].sort((a, b) => a.label.localeCompare(b.label)),
        [baseMaps]
    );

    const handleBaseMapRadioChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(
        (e) =>
            onCurrentBaseMapChange(
                baseMaps.find(
                    (x) => x.handle.toString() === e.currentTarget.value
                )!
            ),
        [baseMaps]
    );

    return (
        <>
            <div
                className={classnames("ol-unselectable", "ol-control", {
                    [styles.baseMapToggleButtonContainer]: true,
                    [styles.baseMapToggleButtonContainerOptionsVisible]:
                        optionsVisible,
                })}
            >
                <button
                    type="button"
                    title="Toggle base map options"
                    onClick={() => setOptionsVisible((x) => !x)}
                >
                    B
                </button>
            </div>
            {optionsVisible && (
                <div className={styles.baseMapRadioGroupContainer}>
                    <RadioGroup
                        label="Base maps"
                        onChange={handleBaseMapRadioChange}
                        selectedValue={currentBaseMap.handle}
                        className={styles.baseMapRadioGroup}
                    >
                        {sortedBaseMaps.map((layer) => (
                            <Radio
                                key={layer.handle}
                                label={layer.label}
                                value={layer.handle}
                            />
                        ))}
                    </RadioGroup>
                </div>
            )}
        </>
    );
}

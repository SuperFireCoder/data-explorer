import { Icon, Radio, RadioGroup } from "@blueprintjs/core";
import { MapLayer } from "@ecocommons-australia/visualiser-client-geospatial";
import classnames from "classnames";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

import styles from "./VisualiserLayersControl.module.css";

type LayerInfo = { layerName: string; label: string };

const isLayerInfo = (x: object): x is LayerInfo => {
    const o = x as any;
    return typeof o.layerName === "string" && typeof o.label === "string";
};

export interface Props<L extends LayerInfo | MapLayer> {
    defaultOptionsVisible?: boolean;

    layers?: readonly L[];
    currentLayer?: L;
    onCurrentLayerChange?: (layer: L) => void;

    baseMaps: readonly MapLayer[];
    currentBaseMap: MapLayer;
    onCurrentBaseMapChange: (baseMap: MapLayer) => void;
}

export default function VisualiserLayersControl<
    L extends LayerInfo | MapLayer
>({
    defaultOptionsVisible = false,

    layers,
    currentLayer,
    onCurrentLayerChange,

    baseMaps,
    currentBaseMap,
    onCurrentBaseMapChange,
}: Props<L>) {
    const [optionsVisible, setOptionsVisible] = useState<boolean>(
        defaultOptionsVisible
    );

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
        [baseMaps, onCurrentBaseMapChange]
    );

    const handleLayerRadioChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(
        (e) =>
            onCurrentLayerChange?.(
                layers?.find(
                    (x) =>
                        (isLayerInfo(x) ? x.layerName : x.handle.toString()) ===
                        e.currentTarget.value
                )!
            ),
        [layers, onCurrentLayerChange]
    );

    return (
        <>
            <div
                className={classnames("ol-unselectable", "ol-control", {
                    [styles.optionsToggleButtonContainer]: true,
                    [styles.optionsToggleButtonContainerOptionsVisible]:
                        optionsVisible,
                })}
            >
                <button
                    type="button"
                    title="Toggle layer options"
                    onClick={() => setOptionsVisible((x) => !x)}
                >
                    <Icon
                        icon="layers"
                        iconSize={14}
                        color={optionsVisible ? "#000" : "#fff"}
                    />
                </button>
            </div>
            {optionsVisible && (
                <div className={styles.optionsContainer}>
                    {layers && (
                        <RadioGroup
                            label="Layers"
                            onChange={handleLayerRadioChange}
                            selectedValue={
                                currentLayer &&
                                (isLayerInfo(currentLayer)
                                    ? currentLayer.layerName
                                    : currentLayer.handle)
                            }
                            className={styles.radioGroup}
                        >
                            {layers.map((layer) => {
                                const key = isLayerInfo(layer)
                                    ? layer.layerName
                                    : layer.handle;
                                const label = layer.label;

                                return (
                                    <Radio
                                        key={key}
                                        label={label}
                                        value={key}
                                    />
                                );
                            })}
                        </RadioGroup>
                    )}

                    <RadioGroup
                        label="Base maps"
                        onChange={handleBaseMapRadioChange}
                        selectedValue={currentBaseMap.handle}
                        className={styles.radioGroup}
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

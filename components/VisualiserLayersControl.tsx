import {Radio, RadioGroup } from "@blueprintjs/core";
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
    layers?: readonly L[];
    isOpen: boolean;
    currentLayer?: L;
    onCurrentLayerChange?: (layer: L) => void;
    currentMapScale: "log" | "linear";
    onCurrentMapScaleChange:(scale: "log" | "linear") => void;
    baseMaps: readonly MapLayer[];
    currentBaseMap: MapLayer;
    onCurrentBaseMapChange: (baseMap: MapLayer) => void;
}

export default function VisualiserLayersControl<
    L extends LayerInfo | MapLayer
>({
    isOpen,

    layers,
    currentLayer,
    onCurrentLayerChange,
    currentMapScale,
    onCurrentMapScaleChange,
    baseMaps,
    currentBaseMap,
    onCurrentBaseMapChange,
}: Props<L>) {

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


    const handleCurrentMapScaleChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(
        (e) =>
        
            onCurrentMapScaleChange(
                e.currentTarget.value as typeof currentMapScale
            ),
            
        [currentMapScale, onCurrentMapScaleChange]
    );





    return (
        <>


            {isOpen && (
                
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
                                        data-cy="layers-radio"
                                        data-testid={label}
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
                    <RadioGroup
                        label="Scale"
                        onChange={handleCurrentMapScaleChange}
                        selectedValue={currentMapScale}
                        className={styles.radioGroup}
                    >
                        <Radio
                            key={1}
                            label="Linear"
                            value="linear"
                        />
                        <Radio
                            key={2}
                            label="Log"
                            value="log"
                        />
                    </RadioGroup>
                </div>
            )}
        </>
    );
}

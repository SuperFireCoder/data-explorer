import React from "react";
import { Callout, Checkbox, Icon, IconName, Intent, Radio, RadioGroup, Label, HTMLSelect } from "@blueprintjs/core";
import { MapLayer, Colourmaps } from "@ecocommons-australia/visualiser-client-geospatial";
import classnames from "classnames";
import {
    FormEvent, 
    FormEventHandler,
    useCallback, 
    useEffect, 
    useMemo, 
    useState
} from "react";
import { LayerInfo, MapScaleId } from "../../hooks/Visualiser";

import styles from "./VisualiserLayersControl.module.css";


const isLayerInfo = (x: object): x is LayerInfo => {
    const o = x as any;
    if (o === undefined){
        throw new Error("isLayerInfo: Could not determine as layer is undefined");
    }
    return typeof o.dataLayer === "string"; // && typeof o.label === "string";
};

/**
 * Get an identifying string ("key") for given layer object.
 *
 * @param layer Layer object
 */
const getLayerKey = (layer: LayerInfo | MapLayer) => {
    return isLayerInfo(layer) ? layer.dataLayer : layer.handle;
};

export interface Props<L extends LayerInfo | MapLayer> {
    defaultOptionsVisible?: boolean;

    layers?: readonly L[];
    currentLayers?: readonly L[];
    onCurrentLayersChange?: (layers: readonly L[]) => void;
    allowMultipleLayerSelection?: boolean;

    baseMaps: readonly MapLayer[];
    currentBaseMap: MapLayer;
    onCurrentBaseMapChange: (baseMap: MapLayer) => void;

    currentMapScale?: MapScaleId;
    onCurrentMapScaleChange?:(scale: MapScaleId) => void;

    currentMapStyle?: string;
    onCurrentMapStyleChange?:(style: string) => void;

    controlLabel?: string;
    controlIcon?: IconName;

    showNoLayerCallout?: boolean;
}

export default function VisualiserLayersControl<
    L extends LayerInfo | MapLayer
>({
    defaultOptionsVisible = false,

    layers,
    currentLayers,
    onCurrentLayersChange,
    allowMultipleLayerSelection,

    baseMaps,
    currentBaseMap,
    onCurrentBaseMapChange,

    currentMapScale,
    onCurrentMapScaleChange,

    currentMapStyle,
    onCurrentMapStyleChange,

    controlLabel = 'layers',
    controlIcon = 'layers',

    showNoLayerCallout = false
}: Props<L>) {

    const [optionsVisible, setOptionsVisible] = useState<boolean>(
        defaultOptionsVisible
    );

    const sortedBaseMaps = useMemo(
        () => [...baseMaps].sort((a, b) => a.label.localeCompare(b.label)),
        [baseMaps]
    );

    const handleBaseMapRadioChange = useCallback<
        FormEventHandler<HTMLSelectElement>
    >(
        (e) =>
            onCurrentBaseMapChange(
                baseMaps.find(
                    (x) => x.handle.toString() === e.currentTarget.value
                )!
            ),
        [baseMaps, onCurrentBaseMapChange]
    );
    
    const handleCurrentMapScaleChange = useCallback<
        FormEventHandler<HTMLSelectElement>
    >(
        (e) => {
            onCurrentMapScaleChange?.(
                e.currentTarget.value as MapScaleId
            );
        },
            
        [currentMapScale, onCurrentMapScaleChange]
    );

    const handleCurrentMapStyleChange = useCallback<
        FormEventHandler<HTMLSelectElement>
    >(
        (e) => {
            onCurrentMapStyleChange?.(
                e.currentTarget.value
            );
        },
        [currentMapStyle, onCurrentMapStyleChange]
    );

    const availableStyles = useMemo(() => {
        const colourmapType = (currentLayers?.[0] as MapLayer)?.colourmapType;
        if (colourmapType === undefined){
            return undefined;
        }
        return Colourmaps.getNames(colourmapType);
    }, [currentLayers])

    const allowScale = useMemo(() => {
        const colourmapType = (currentLayers?.[0] as MapLayer)?.colourmapType;
        if (colourmapType === undefined){
            return undefined;
        }
        return Colourmaps.getNames(colourmapType);
    }, [currentLayers])

    const layerSelector = useMemo(() => {
        if (layers === undefined){
            return null;
        }

        // Multiple selection
        if (allowMultipleLayerSelection === true){
            return layers.map((layer) => {
                const key = getLayerKey(layer);
                const label = layer.label;
                const handleLayerCheckboxChange = (e: FormEvent<HTMLInputElement>) => {
                    if (e.currentTarget.checked) {
                        onCurrentLayersChange?.([...(currentLayers ?? []), layer])
                    } else {
                        const newCurrentLayers = [...currentLayers ?? []];
                        const i = newCurrentLayers.findIndex(x => x === layer);
                        newCurrentLayers.splice(i,1);
                        onCurrentLayersChange?.(newCurrentLayers)
                    }
                };

                return (
                    <Checkbox
                        key={key}
                        label={label}
                        value={key}
                        data-cy="layer-option-layers-checkbox"
                        data-testid={key}
                        onChange={handleLayerCheckboxChange}
                        checked={
                            currentLayers?.some(l => getLayerKey(l) === key) ?? false
                        }
                    />
                );
            })

        // Single selection
        } else {
            const handleLayerRadioChange = (e: FormEvent<HTMLInputElement>) => {
                onCurrentLayersChange?.(
                    layers?.filter(
                        (x) =>
                            (isLayerInfo(x) ? x.dataLayer : x.handle.toString()) ===
                            e.currentTarget.value
                    )
                )
            };

            return (
                <RadioGroup
                    label="Layers"
                    onChange={handleLayerRadioChange}
                    selectedValue={(
                        currentLayers?.[0] && 
                        getLayerKey(currentLayers[0])
                    )}
                    className={styles.radioGroup}
                >
                    {layers.map((layer) => {
                        const key = getLayerKey(layer);
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
            );
        }
    }, [allowMultipleLayerSelection, layers, currentLayers])

    const noLayerCallout = useMemo(() => {
        if (showNoLayerCallout && Array.isArray(currentLayers) === false || currentLayers?.length === 0){
            return (
                <Callout
                    intent={Intent.WARNING}
                    icon="issue"
                >
                   Select a layer
                </Callout>
            )
        }
        return undefined;
    }, [currentLayers, showNoLayerCallout]);

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
                    data-cy="layer-options-button"
                    onClick={() => setOptionsVisible((x) => !x)}
                >
                    <Icon
                        icon={controlIcon}
                        iconSize={14}
                        color={"#000"}
                    />
                    &nbsp;{controlLabel}
                </button>
            </div>

            {optionsVisible && (
                <div className={styles.optionsContainer} data-cy="layer-options-panel">
                    {noLayerCallout}
                    {layers && (
                        <div className={styles.layerSelection} data-cy="layer-option-layers">
                            {layerSelector}
                        </div>
                    )}
                    <Label key="layer-option-basemap" className={styles.selectLabel}>Base maps
                        <HTMLSelect
                            data-cy="layer-option-basemap"
                            minimal
                            onChange={handleBaseMapRadioChange}
                            value={currentBaseMap.handle}
                        >
                            {sortedBaseMaps.map((layer) => (
                                <option
                                    key={layer.handle}
                                    value={layer.handle}
                                >{layer.label}</option>
                            ))}
                        </HTMLSelect>
                    </Label>

                    {currentMapStyle !== undefined && availableStyles &&
                        <Label key="layer-option-style" className={styles.selectLabel}>Color &amp; legend
                            <HTMLSelect
                                data-cy="layer-option-style"
                                minimal
                                onChange={handleCurrentMapStyleChange}
                                value={currentMapStyle}
                            >
                                {availableStyles.map((style, index) => (
                                    <option key={index} value={style}>{style}</option>

                                ))}
                            </HTMLSelect>
                        </Label>
                    }

                    {currentMapScale !== undefined &&
                        <Label key="layer-option-scale" className={styles.selectLabel}>Scale
                            <HTMLSelect
                                data-cy="layer-option-scale"
                                minimal
                                onChange={handleCurrentMapScaleChange}
                                value={currentMapScale}
                            >
                                <option key={1} value="linear">Linear</option>
                                <option key={2} value="log">Log</option>
                            </HTMLSelect>
                        </Label>
                    }

                </div>
            )}
        </>
    );
}

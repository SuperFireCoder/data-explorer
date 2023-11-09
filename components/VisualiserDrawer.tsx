import { Button, Drawer, Classes, Position, ProgressBar } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    MapLayer,
    Projections,
    Colourmaps,
    CoverageUtils,
    VisualiserGeospatial,
} from "@ecocommons-australia/visualiser-client-geospatial";
import { OverlayContentProps } from "@ecocommons-australia/visualiser-client-geospatial/dist/VisualiserGeospatial";
import axios from "axios";

import { getDataExplorerBackendServerUrl } from "../util/env";
import { Dataset } from "../interfaces/Dataset";
import {
    useEcMapVisualiserRequest,
    useVisualiserSupport,
    LayerInfo
} from "../hooks/Visualiser";
import VisualiserLayersControl from "./VisualiserLayersControl";

import styles from "./VisualiserDrawer.module.css";

export interface Props {
    drawerTitle: string;
    datasetId: string;
    isOpen: boolean;
    onClose?: () => void;
}

export default function VisualiserDrawer({
    drawerTitle,
    datasetId,
    isOpen,
    onClose,
}: Props) {
    const {
        data: {
            currentVisibleLayers,
            setCurrentVisibleLayers,
            currentMapScale,
            setCurrentMapScale,
            currentMapStyle,
            setCurrentMapStyle,
            setRegisteredDatasetLayers,
            baseMaps,
            currentBaseMap,
            setCurrentBaseMap,
            getBearerTokenFn,
        },
        visualiserProps,
    } = useVisualiserSupport();

    const { getNewEcMapVisualiserRequest } = useEcMapVisualiserRequest();

    const [metadata, setMetadata] = useState<
        | { type: "dataset"; datasetId: string; data: Dataset }
        | { type: "error"; datasetId: string; error: any }
        | undefined
    >(undefined);

    const layerInfo = useMemo<LayerInfo[]>(() => {
        if (metadata === undefined || metadata.type === "error") {
            return [];
        }

        if (metadata.data.type === "File") {
            return [];
        }

        return Object.keys(metadata.data.parameters).map((layerName) => {
            // NOTE: Currently assuming data type from `rangeAlternates`
            // property
            // FIXME: Have backend pass actual data type of the layer
            const dataType =
                metadata.data.rangeAlternates["dmgr:tiff"] !== undefined
                    ? ("raster" as const)
                    : ("point" as const);

            const tempUrl =
                dataType === "raster"
                    ? metadata.data.rangeAlternates?.["dmgr:tiff"]?.[layerName]
                          ?.tempurl
                    : metadata.data.rangeAlternates?.["dmgr:csv"]?.tempurl;

            const colourmapType = CoverageUtils.getLayerColourmapTypeFromCov(metadata.data, layerName);

            if (tempUrl === undefined) {
                throw new Error(`Cannot obtain temp URL for "${layerName}"`);
            }

            return {
                datasetId,
                dataType,
                label: metadata.data.parameters[layerName].observedProperty
                    .label.en,
                layerName,
                layerUrl: tempUrl,
                colourmapType,
            };
        });
    }, [datasetId, metadata]);

    const handleCurrentLayersChange = (
        mapLayers: readonly LayerInfo[]
    ) => {
        // Find parent objects of each of the map layers
        const newVisibleDatasetLayers = layerInfo?.filter(
            (x) => mapLayers.find(y => y.layerName === x.layerName)
        );
        setCurrentVisibleLayers(newVisibleDatasetLayers);
    };

    const renderVisualiserOverlayContent = useCallback(
        (props: OverlayContentProps) => {
            const currentLayerName = currentVisibleLayers[0]?.layerName;
            const currentLayer = layerInfo?.find(
                (x) => x.layerName === currentLayerName
            );

            
            return (
                <>
                    <div className={styles.tileLoadProgressBar}>
                        {(props.isTileLoading || metadata === undefined) && (
                            <ProgressBar animate stripes value={1} />
                        )}
                    </div>
                    <div className={styles.legendImageContainer}>
                        {/* FIXME: This is a temporary solution to render legends on assumption there is only one visible layer */}
                        {props._legendImages[0] !== undefined && (
                            <img src={props._legendImages[0]} />
                        )}
                    </div>

                    <VisualiserLayersControl
                        defaultOptionsVisible={! currentLayer}
                        layers={layerInfo}
                        allowMultipleLayerSelection={false}
                        currentLayers={currentVisibleLayers}
                        onCurrentLayersChange={handleCurrentLayersChange}
                        baseMaps={baseMaps}
                        currentBaseMap={currentBaseMap}
                        onCurrentBaseMapChange={setCurrentBaseMap}
                        currentMapStyle={currentMapStyle}
                        onCurrentMapStyleChange={setCurrentMapStyle}
                        currentMapScale={currentMapScale}
                        onCurrentMapScaleChange={setCurrentMapScale}
                    />
                </>
            );
        },
        [
            metadata,
            layerInfo,
            currentVisibleLayers,
            baseMaps,
            currentBaseMap,
            setCurrentBaseMap,
            currentMapScale,
            setCurrentMapScale,
            currentMapStyle,
            setCurrentMapStyle
        ]
    );

    useEffect(
        function syncRegisteredLayersWithDataset() {
            // No dataset = nothing to render
            if (layerInfo === undefined) {
                setRegisteredDatasetLayers([]);
                setCurrentVisibleLayers([]);
                return;
            }

            setRegisteredDatasetLayers(
                layerInfo.map(
                    ({ datasetId, dataType, label, layerName, layerUrl}) => {
                        const mapRequest = getNewEcMapVisualiserRequest({
                            dataUrl: layerUrl,
                            dataLayer: layerName,
                            dataType: dataType,
                            mapStyle: currentMapStyle,
                            mapScale: currentMapScale,
                            datasetId: datasetId,
                            dataParameters: metadata && "data" in metadata && metadata.data.parameters[layerName]? metadata.data.parameters[layerName]: undefined,
                            domain: metadata && 'data' in metadata? metadata.data.domain: undefined,
                    });
                        mapRequest.getBearerToken = getBearerTokenFn;

                        return {
                            datasetId,
                            layerName,
                            layerUrl,
                            mapLayer: new MapLayer({
                                type: "ecocommons-visualiser",
                                label,
                                mapRequest,
                                mapProjection:
                                    Projections.DEFAULT_MAP_PROJECTION,
                            }),
                        };
                    }
                ) ?? []
            );

            if (layerInfo.length === 0) {
                setCurrentVisibleLayers([]);
                return;
            }

            // Set current dataset preview to first layer
            setCurrentVisibleLayers([layerInfo[0]]);
        },
        [
            currentMapScale,
            currentMapStyle,
            layerInfo,
            getNewEcMapVisualiserRequest,
            getBearerTokenFn,
            setRegisteredDatasetLayers,
            setCurrentVisibleLayers,
        ]
    );

    useEffect(
        function loadMetadata() {
            // No need to load metadata when not open, or if it was already
            // fetched before
            if (!isOpen || metadata?.datasetId === datasetId) {
                return;
            }

            const cancellationToken = axios.CancelToken.source();

            (async () => {
                try {
                    const headers: Record<string, string> = {};

                    const keycloakToken = getBearerTokenFn();

                    if (keycloakToken && keycloakToken.length > 0) {
                        headers["Authorization"] = `Bearer ${keycloakToken}`;
                    }

                    const { data } = await axios.get(
                        `${getDataExplorerBackendServerUrl()}/api/dataset/${datasetId}`,
                        { headers }
                    );

                    setMetadata({ type: "dataset", datasetId, data });
                } catch (e) {
                    // Ignore cancellation
                    if (axios.isCancel(e)) {
                        return;
                    }

                    // Set error state
                    setMetadata({ type: "error", datasetId, error: e });
                }
            })();

            return function stopLoadMetadata() {
                cancellationToken.cancel();
            };
        },
        [getBearerTokenFn, datasetId, isOpen, metadata?.datasetId]
    );

    return (
        <Drawer
            icon="info-sign"
            onClose={onClose}
            title={drawerTitle}
            autoFocus
            canEscapeKeyClose
            canOutsideClickClose
            enforceFocus
            hasBackdrop
            isOpen={isOpen}
            position={Position.RIGHT}
            size="100%"
            usePortal
        >
            <div
                className={Classes.DRAWER_BODY}
                data-testid="visualiser-drawer"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                }}
            >
                <Row
                    disableDefaultMargins
                    align="stretch"
                    gutterWidth={0}
                    nogutter
                    style={{ flex: 1 }}
                >
                    <Col
                        xs={12}
                        style={{ position: "relative", display: "flex" }}
                    >
                        <VisualiserGeospatial
                            {...visualiserProps}
                            className={styles.visualiserContainer}
                            mapClassName={styles.mapContainer}
                            fullscreenControl
                            scaleControl
                            renderOverlayContent={
                                renderVisualiserOverlayContent
                            }
                        />
                    </Col>
                </Row>
            </div>
        </Drawer>
    );
}

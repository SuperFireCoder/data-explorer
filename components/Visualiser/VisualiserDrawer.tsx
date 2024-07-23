import axios from "axios";
import { Button, Drawer, Classes, Position, ProgressBar } from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ECMapVisualiserRequest,
    MapLayer,
    Projections,
    Colourmaps,
    CoverageUtils,
    VisualiserGeospatial,
    SpatialMetadataBar,
    ViewZoom
} from "@ecocommons-australia/visualiser-client-geospatial";
import { OverlayContentProps } from "@ecocommons-australia/visualiser-client-geospatial/dist/VisualiserGeospatial";
import {
    Coverage,
    Axes
} from "@ecocommons-australia/visualiser-client-geospatial/dist/interfaces/Coverage";
import { getDataExplorerBackendServerUrl } from "../../util/env";
import { Dataset } from "../../interfaces/Dataset";
import {
    useEcMapVisualiserRequest,
    useVisualiserSupport,
    LayerInfo,
    RegisteredLayer
} from "../../hooks/Visualiser";
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

    const [ errorMessage, setErrorMessage ] = useState<string | undefined>();

    const [metadata, setMetadata] = useState<
        | { type: "dataset"; datasetId: string; data: Dataset }
        | { type: "error"; datasetId: string; error: any }
        | undefined
    >(undefined);

    /** 
     * The Visualiser lib uses the Coverage interface only.
     */
    const coverage = useMemo(() => {
        if (metadata?.type !== "dataset"){
            return;
        }
        return metadata?.data as Coverage;
    }, [metadata?.type]);

    /** 
     * Get the Coverage Axes from the Dataset, 
     * or compute one using legacy bccvl:metadata.
     */
    const axes = useMemo(() => {
        if (coverage === undefined){
            return;
        }
        return CoverageUtils.getAxesFromCovDomain(coverage);
    }, [coverage]);

    /** 
     * Get an EPSG code (coordinate reference system).
     */
    const epsg = useMemo(() => {
        if (coverage === undefined){
            return;
        }
        const _epsg = CoverageUtils.getEPSGFromCovDomain(coverage);
        return _epsg ? parseInt(_epsg) : undefined;
    }, [coverage]);

    /** 
     * Compute default map zoom and orientation.
     */

    const { viewZoomProps } = ViewZoom.useViewZoom({ axes, epsg });

    useEffect(() => {
        setErrorMessage(undefined);
    }, [metadata]);

    const availableLayers = useMemo<LayerInfo[]>(() => {
        if (metadata === undefined || metadata.type === "error") {
            return [];
        }

        if (metadata.data.type === "File") {
            return [];
        }

        return Object.keys(metadata.data.parameters).map((dataLayer) => {
            // NOTE: Currently assuming data type from `rangeAlternates`
            // property
            // FIXME: Have backend pass actual data type of the layer
            const dataType =
                metadata.data.rangeAlternates["dmgr:tiff"] !== undefined
                    ? ("raster" as const)
                    : ("point" as const);

            const tempUrl =
                dataType === "raster"
                    ? metadata.data.rangeAlternates?.["dmgr:tiff"]?.[dataLayer]
                          ?.tempurl
                    : metadata.data.rangeAlternates?.["dmgr:csv"]?.tempurl;

            const colourmapType = CoverageUtils.getColourmapTypeForCovParam(metadata.data, dataLayer);

            if (tempUrl === undefined) {
                throw new Error(`Cannot obtain temp URL for "${dataLayer}"`);
            }

            return {
                datasetId,
                dataType,
                label: metadata.data.parameters[dataLayer].observedProperty
                    .label.en,
                dataLayer,
                dataUrl: tempUrl,
                colourmapType,
            };
        });
    }, [datasetId, metadata]);

    const handleCurrentLayersChange = (
        mapLayers: readonly LayerInfo[]
    ) => {
        // Find parent objects of each of the map layers
        const newVisibleDatasetLayers = availableLayers?.filter(
            (x) => mapLayers.find(y => y.dataLayer === x.dataLayer)
        );
        setCurrentVisibleLayers(newVisibleDatasetLayers);
    };

    const renderVisualiserOverlayContent = useCallback(
        (props: OverlayContentProps) => {
            const currentLayerName = currentVisibleLayers[0]?.dataLayer;
            const currentLayer = availableLayers?.find(
                (x) => x.dataLayer === currentLayerName
            );

            return (
                <>
                    {coverage &&
                        <div className={styles.spatialMetadataBar}>
                            <SpatialMetadataBar coverage={coverage}/>
                        </div>
                    }

                    <div className={styles.tileLoadProgressBar}>
                        {(props.isTileLoading || metadata === undefined) && (
                            <ProgressBar animate stripes value={1} />
                        )}
                    </div>

                    <div className={styles.legendImageContainer}>
                        {/* FIXME: This is a temporary solution to render legends on assumption there is only one visible layer */}
                        {props._legendImages[0] !== undefined && (
                            <img src={props._legendImages[0]} alt="Map legend image"/>
                        )}
                    </div>

                    <VisualiserLayersControl
                        defaultOptionsVisible={! currentLayer}
                        layers={availableLayers}
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
            coverage,
            metadata,
            availableLayers,
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
            if (availableLayers === undefined) {
                setRegisteredDatasetLayers([]);
                setCurrentVisibleLayers([]);
                return;
            }

            setRegisteredDatasetLayers(
                availableLayers.map(
                    ({ datasetId, dataType, label, dataLayer, dataUrl}) => {
                        const mapRequest = getNewEcMapVisualiserRequest({
                            dataUrl: dataUrl as string,
                            dataLayer,
                            dataType,
                            dataParameters: coverage?.parameters[dataLayer],
                            mapStyle: currentMapStyle,
                            mapScale: currentMapScale,
                            datasetId: datasetId,
                            domain: coverage?.domain
                    });
                        mapRequest.getBearerToken = getBearerTokenFn;

                        return {
                            datasetId,
                            dataLayer,
                            dataUrl,
                            mapLayer: new MapLayer({
                                type: "ecocommons-visualiser",
                                label,
                                mapRequest,
                                mapProjection:
                                    Projections.DEFAULT_MAP_PROJECTION,
                            }),
                        } as RegisteredLayer;
                    }
                ) ?? []
            );

            if (availableLayers.length === 0) {
                setCurrentVisibleLayers([]);
                return;
            }

            // Set current dataset preview to first layer
            setCurrentVisibleLayers([availableLayers[0]]);
        },
        [
            coverage,
            currentMapScale,
            currentMapStyle,
            availableLayers,
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
                        {metadata && <VisualiserGeospatial
                            {...visualiserProps}
                            {...viewZoomProps}
                            className={styles.visualiserContainer}
                            mapClassName={styles.mapContainer}
                            fullscreenControl
                            scaleControl
                            renderOverlayContent={
                                renderVisualiserOverlayContent
                            }
                        /> || <ProgressBar animate stripes value={1} />}
                    </Col>
                </Row>
            </div>
        </Drawer>
    );
}

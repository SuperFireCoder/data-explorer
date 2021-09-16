import { ProgressBar } from "@blueprintjs/core";
import {
    MapLayer,
    Projections,
    VisualiserGeospatial,
} from "@ecocommons-australia/visualiser-client-geospatial";
import { OverlayContentProps } from "@ecocommons-australia/visualiser-client-geospatial/dist/VisualiserGeospatial";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { getDataExplorerBackendServerUrl } from "../util/env";
import { Dataset } from "../interfaces/Dataset";

import {
    useEcMapVisualiserRequest,
    useVisualiserSupport,
} from "../hooks/Visualiser";

import styles from "./VisualiserView.module.css";

export interface Props {
    datasetId: string;
}

// NOTE: This currently only supports geospatial visualisation

export default function VisualiserView({ datasetId }: Props) {
    const [metadata, setMetadata] = useState<
        | { type: "dataset"; data: Dataset }
        | { type: "error"; error: any }
        | undefined
    >(undefined);

    const {
        data: {
            setCurrentVisibleLayers,
            setRegisteredDatasetLayers,
            getBearerTokenFn,
        },
        visualiserProps,
    } = useVisualiserSupport();

    const { getNewEcMapVisualiserRequest } = useEcMapVisualiserRequest();

    const renderVisualiserOverlayContent = useCallback(
        (props: OverlayContentProps) => {
            return (
                <>
                    <div className={styles.tileLoadProgressBar}>
                        {(props.isTileLoading || metadata === undefined) && (
                            <ProgressBar animate stripes value={1} />
                        )}
                    </div>
                </>
            );
        },
        [metadata]
    );

    useEffect(
        function loadMetadata() {
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

                    setMetadata({ type: "dataset", data });
                } catch (e) {
                    // Ignore cancellation
                    if (axios.isCancel(e)) {
                        return;
                    }

                    // Set error state
                    setMetadata({ type: "error", error: e });
                }
            })();

            return function stopLoadMetadata() {
                cancellationToken.cancel();
            };
        },
        [getBearerTokenFn, datasetId]
    );

    useEffect(
        function syncRegisteredLayersWithDataset() {
            // No dataset = nothing to render
            if (metadata === undefined || metadata.type !== "dataset") {
                setRegisteredDatasetLayers([]);
                setCurrentVisibleLayers([]);
                return;
            }

            const layers = Object.keys(metadata.data.parameters).map(
                (layerName) => {
                    const tempUrl =
                        metadata.data.rangeAlternates?.["dmgr:tiff"]?.[
                            layerName
                        ]?.tempurl;

                    if (tempUrl === undefined) {
                        throw new Error(
                            `Cannot obtain temp URL for "${layerName}"`
                        );
                    }

                    return {
                        datasetId,
                        label: metadata.data.parameters[layerName]
                            .observedProperty.label.en,
                        layerName,
                        layerUrl: {
                            __tempUrl: tempUrl,
                        },
                    };
                }
            );

            setRegisteredDatasetLayers(
                layers.map(({ datasetId, label, layerName, layerUrl }) => {
                    // NOTE: Currently assuming data type from `rangeAlternates`
                    // property
                    // FIXME: Have backend pass actual data type of the layer
                    const dataType =
                        metadata.data.rangeAlternates["dmgr:tiff"] !== undefined
                            ? "raster"
                            : "point";

                    const mapRequest = getNewEcMapVisualiserRequest(
                        layerUrl,
                        layerName,
                        dataType
                    );
                    mapRequest.getBearerToken = getBearerTokenFn;

                    return {
                        datasetId,
                        layerName,
                        layerUrl,
                        mapLayer: new MapLayer({
                            type: "ecocommons-visualiser",
                            label,
                            mapRequest,
                            mapProjection: Projections.DEFAULT_MAP_PROJECTION,
                        }),
                    };
                })
            );

            // Set current dataset preview to first layer
            if (layers.length === 0) {
                setCurrentVisibleLayers([]);
                return;
            }

            setCurrentVisibleLayers([
                {
                    datasetId: layers[0].datasetId,
                    layerName: layers[0].layerName,
                },
            ]);
        },
        [
            datasetId,
            metadata,
            getNewEcMapVisualiserRequest,
            getBearerTokenFn,
            setRegisteredDatasetLayers,
            setCurrentVisibleLayers,
        ]
    );

    return (
        <VisualiserGeospatial
            {...visualiserProps}
            className={styles.visualiserContainer}
            mapClassName={styles.mapContainer}
            fullscreenControl
            scaleControl
            renderOverlayContent={renderVisualiserOverlayContent}
        />
    );
}

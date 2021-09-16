import {
    Drawer,
    Classes,
    Position,
    ProgressBar,
    RadioGroup,
    Radio,
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import {
    FormEvent,
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    MapLayer,
    Projections,
    VisualiserGeospatial,
} from "@ecocommons-australia/visualiser-client-geospatial";
import { OverlayContentProps } from "@ecocommons-australia/visualiser-client-geospatial/dist/VisualiserGeospatial";
import axios from "axios";

import { getDataExplorerBackendServerUrl } from "../util/env";
import { Dataset } from "../interfaces/Dataset";
import {
    useEcMapVisualiserRequest,
    useVisualiserSupport,
} from "../hooks/Visualiser";

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
            setRegisteredDatasetLayers,
            getBearerTokenFn,
        },
        visualiserProps,
    } = useVisualiserSupport();

    const { getNewEcMapVisualiserRequest } = useEcMapVisualiserRequest();

    const [metadata, setMetadata] = useState<
        | { type: "dataset"; data: Dataset }
        | { type: "error"; error: any }
        | undefined
    >(undefined);

    const layerInfo = useMemo(() => {
        if (metadata === undefined || metadata.type === "error") {
            return undefined;
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

            if (tempUrl === undefined) {
                throw new Error(`Cannot obtain temp URL for "${layerName}"`);
            }

            return {
                datasetId,
                dataType,
                label: metadata.data.parameters[layerName].observedProperty
                    .label.en,
                layerName,
                layerUrl: {
                    __tempUrl: tempUrl,
                },
            };
        });
    }, [datasetId, metadata]);

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

    const handleLayersRadioGroupChange = useCallback<
        FormEventHandler<HTMLInputElement>
    >(
        (e) => {
            const layerName = e.currentTarget.value;

            setCurrentVisibleLayers([
                {
                    datasetId,
                    layerName,
                },
            ]);
        },
        [datasetId]
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
                    ({ datasetId, dataType, label, layerName, layerUrl }) => {
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
                                mapProjection:
                                    Projections.DEFAULT_MAP_PROJECTION,
                            }),
                        };
                    }
                ) ?? []
            );

            // Set current dataset preview to first layer
            if (layerInfo.length === 0) {
                setCurrentVisibleLayers([]);
                return;
            }

            setCurrentVisibleLayers([
                {
                    datasetId: layerInfo[0].datasetId,
                    layerName: layerInfo[0].layerName,
                },
            ]);
        },
        [
            layerInfo,
            getNewEcMapVisualiserRequest,
            getBearerTokenFn,
            setRegisteredDatasetLayers,
            setCurrentVisibleLayers,
        ]
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
                    nowrap
                    style={{ flex: 1 }}
                >
                    <Col xs={3}>
                        {layerInfo === undefined && (
                            <Row>
                                <Col xs={12}>
                                    <p>Please wait...</p>
                                </Col>
                            </Row>
                        )}
                        {layerInfo !== undefined && (
                            <Row>
                                <Col xs={12}>
                                    <RadioGroup
                                        label="Layers"
                                        onChange={handleLayersRadioGroupChange}
                                        selectedValue={
                                            currentVisibleLayers[0] &&
                                            currentVisibleLayers[0].layerName
                                        }
                                    >
                                        {layerInfo.map(
                                            ({ layerName, label }) => (
                                                <Radio
                                                    key={layerName}
                                                    label={label}
                                                    value={layerName}
                                                />
                                            )
                                        )}
                                    </RadioGroup>
                                </Col>
                            </Row>
                        )}
                    </Col>
                    <Col
                        xs={9}
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

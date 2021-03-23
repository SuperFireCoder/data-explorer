import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";

import { useKeycloakInfo } from "../util/keycloak";
import { getDataExplorerBackendServerUrl } from "../util/env";
import { Dataset } from "../interfaces/Dataset";
import { RenderTarget, WrapperContext } from "@ecocommons-australia/visualiser";
import { WrapperContextData } from "@ecocommons-australia/visualiser/dist/interfaces/WrapperContextData";

import styles from "./VisualiserView.module.css";

export interface Props {
    datasetId: string;
}

// NOTE: This currently only supports geospatial visualisation

export default function VisualiserView({ datasetId }: Props) {
    const { keycloak } = useKeycloakInfo();
    const keycloakToken = keycloak?.token;

    const [metadata, setMetadata] = useState<
        | { type: "dataset"; data: Dataset }
        | { type: "error"; error: any }
        | undefined
    >(undefined);

    // TODO: Turn the auth object and its effects into a separate hook
    const { current: authObject } = useRef({
        isAuthenticated: false,
        getBearerToken: () => "" as string,
    });

    useEffect(
        function syncAuthObjectState() {
            // Update auth object's values

            if (keycloakToken === undefined) {
                authObject.isAuthenticated = false;
                authObject.getBearerToken = () => "";

                return;
            }

            authObject.isAuthenticated = true;
            authObject.getBearerToken = () => keycloakToken;
        },
        [keycloakToken]
    );

    const visualiserWrapperContextData = useMemo<WrapperContextData>(() => {
        async function getObjectStoreTemporaryUrl(tempUrlEndpointUrl: string) {
            const headers: Record<string, string> = {};

            if (keycloakToken && keycloakToken.length > 0) {
                headers["Authorization"] = `Bearer ${keycloakToken}`;
            }

            const { data } = await axios.get(tempUrlEndpointUrl, {
                headers,
            });

            return data.url;
        }

        switch (metadata?.type) {
            case "dataset": {
                // Determine if dataset is TIFF or CSV
                const rangeAlternates = metadata.data.rangeAlternates;

                if (rangeAlternates["dmgr:csv"] !== undefined) {
                    const tempUrlEndpointUrl =
                        rangeAlternates["dmgr:csv"].tempurl;

                    return {
                        availableRenderModes: ["geospatial"],
                        label: metadata.data["bccvl:metadata"].title,
                        url: () =>
                            getObjectStoreTemporaryUrl(tempUrlEndpointUrl),
                        // FIXME: What should be used for the layer name in CSV
                        // point data rendering?
                        geospatialDataLayer: "__POINTDATA__",
                        geospatialDataType: "point",
                    };
                } else if (rangeAlternates["dmgr:tiff"] !== undefined) {
                    // Get first layer
                    // TODO: Support multi-layer datasets
                    const [layerName, layerInfo] = Object.entries(
                        rangeAlternates["dmgr:tiff"]
                    )[0];

                    return {
                        availableRenderModes: ["geospatial"],
                        // TODO: Support multi-layer datasets
                        label: metadata.data["bccvl:metadata"].title,
                        url: () =>
                            getObjectStoreTemporaryUrl(layerInfo.tempurl),
                        geospatialDataLayer: layerName,
                        geospatialDataType: "raster",
                    };
                } else {
                    throw new Error(
                        "Could not determine appropriate render mode for this type of data"
                    );
                }
            }

            case "error":
            case undefined:
            default: {
                return {
                    availableRenderModes: [],
                    label: undefined,
                    url: undefined,
                };
            }
        }
    }, [metadata, keycloakToken]);

    useEffect(
        function loadMetadata() {
            const cancellationToken = axios.CancelToken.source();

            (async () => {
                try {
                    const headers: Record<string, string> = {};

                    if (keycloakToken && keycloakToken.length > 0) {
                        headers["Authorization"] = `Bearer ${keycloakToken}`;
                    }

                    const {
                        data,
                    } = await axios.get(
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
        [keycloakToken, datasetId]
    );

    switch (metadata?.type) {
        case "dataset": {
            return (
                <div style={{ height: "100%" }}>
                    <WrapperContext
                        data={visualiserWrapperContextData}
                        auth={authObject}
                    >
                        <RenderTarget className={styles.renderTarget} />
                    </WrapperContext>
                </div>
            );
        }

        case "error": {
            return <div>An error occurred</div>;
        }

        case undefined:
        default: {
            return <div>Please wait...</div>;
        }
    }
}

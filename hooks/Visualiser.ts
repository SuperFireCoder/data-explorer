import {
    ECMapVisualiserRequest,
    MapLayer,
    BaseMaps,
} from "@ecocommons-australia/visualiser-client-geospatial";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useKeycloakInfo } from "../util/keycloak";

export const useVisualiserSupport = () => {
    const { keycloak } = useKeycloakInfo();
    const keycloakToken = keycloak?.token;

    const bearerTokenRef = useRef<string | undefined>(undefined);
    const getBearerTokenFn = useCallback(() => bearerTokenRef.current, []);

    useEffect(
        function updateBearerTokenRef() {
            bearerTokenRef.current = keycloakToken;
        },
        [keycloakToken]
    );

    const [currentVisibleLayers, setCurrentVisibleLayers] = useState<
        readonly {
            datasetId?: string;
            layerName: string;
        }[]
    >([]);
    const [currentBaseMap, setCurrentBaseMap] = useState<MapLayer>(
        BaseMaps.BCCVL_DEFAULT_BASE_MAPS[0]
    );

    const [currentMapScale, setCurrentMapScale] = useState<"linear" | "log">("linear");
    const [currentMapStyle, setCurrentMapStyle] = useState<string>("Default");

    const [registeredDatasetLayers, setRegisteredDatasetLayers] = useState<
        readonly {
            datasetId?: string;
            layerName: string;
            layerUrl?: string | { __tempUrl: string };
            mapLayer: MapLayer;
        }[]
    >([]);

    const registeredLayers = useMemo(
        () => registeredDatasetLayers.map((x) => x.mapLayer),
        [registeredDatasetLayers]
    );

    const visibleLayers = useMemo(() => {
        // Return just base map when no data selected for previewing
        if (currentVisibleLayers === undefined) {
            return [currentBaseMap];
        }

        const visibleMapLayers: MapLayer[] = [];

        currentVisibleLayers.forEach(({ datasetId, layerName }) => {
            const visibleMapLayer = registeredDatasetLayers.find(
                (x) => x.datasetId === datasetId && x.layerName === layerName
            )?.mapLayer;

            // If layer could not be found, skip
            if (visibleMapLayer === undefined) {
                return;
            }

            // Otherwise push to array
            visibleMapLayers.push(visibleMapLayer);
        });

        return visibleMapLayers;
    }, [currentVisibleLayers, registeredDatasetLayers, currentMapScale]);

    const registeredBaseLayers = BaseMaps.BCCVL_DEFAULT_BASE_MAPS;

    const visibleBaseLayers = useMemo(() => [currentBaseMap], [currentBaseMap]);

    return {
        data: {
            currentVisibleLayers,
            setCurrentVisibleLayers,
            currentMapScale,
            setCurrentMapScale,
            currentMapStyle,
            setCurrentMapStyle,
            baseMaps: registeredBaseLayers,
            currentBaseMap,
            setCurrentBaseMap,
            registeredDatasetLayers,
            setRegisteredDatasetLayers,
            getBearerTokenFn,
        },

        visualiserProps: {
            registeredLayers,
            visibleLayers,
            registeredBaseLayers,
            visibleBaseLayers,
        },
    };
};

export const useEcMapVisualiserRequest = () => {
    const mapRequestsSetRef = useRef<Set<ECMapVisualiserRequest>>(new Set());

    useEffect(function destroyAllMapLayerObjectsOnUnmount() {
        return function () {
            mapRequestsSetRef.current.forEach((r) => r.destroy());
        };
    }, []);

    const getNewEcMapVisualiserRequest = useCallback(
        (...args: ConstructorParameters<typeof ECMapVisualiserRequest>) => {
            const mapRequest = new ECMapVisualiserRequest(...args);
            mapRequestsSetRef.current.add(mapRequest);
            return mapRequest;
        },
        []
    );

    return {
        getNewEcMapVisualiserRequest,
    };
};

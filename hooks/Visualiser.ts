import {
    ECMapVisualiserRequest,
    MapLayer,
    BaseMaps,
    Colourmaps,
} from "@ecocommons-australia/visualiser-client-geospatial";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useKeycloakInfo } from "../util/keycloak";

/** 
 * All required and optional attributes of an available layer.
 */
export interface LayerInfo {
    label: string;
    dataType: 'raster' | 'point' | 'polygon';
    dataLayer: string;
    dataUrl?: string;
    mapScale?: MapScaleId;
    mapStyle?: string;
    mapStyleReqRemap?: boolean;
    mapStyleType?: Colourmaps.Type;
    datasetId?: string;
}

export interface VisualiserDefaults {
    mapScale?: MapScaleId;
    mapStyle?: string;
    mapStyleType?: Colourmaps.Type;
    mapStyleReqRemap?: boolean;
}

/** 
 * As above but includes MapLayer which implements the map view specifically.
 */
export interface RegisteredLayer extends LayerInfo {
    mapLayer: MapLayer;
}

export type MapScaleId = 'linear' | 'log';


export const useVisualiserSupport = (defaults: VisualiserDefaults = {}) => {
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
        readonly LayerInfo[]
    >([]);
    
    const [currentBaseMap, setCurrentBaseMap] = useState<MapLayer>(
        BaseMaps.BCCVL_DEFAULT_BASE_MAPS[0]
    );

    const [currentMapScale, setCurrentMapScale] = useState<MapScaleId | undefined>(defaults.mapScale);
    const [currentMapStyle, setCurrentMapStyle] = useState<string | undefined>(defaults.mapStyle);

    useEffect(
        function updateCurrentMapScaleStyle() {
            if (Array.isArray(currentVisibleLayers) && currentVisibleLayers.length > 0){
                if (currentMapScale === undefined && currentVisibleLayers[0].mapScale){
                    setCurrentMapScale(currentVisibleLayers[0].mapScale);
                }
                if (currentMapStyle === undefined && currentVisibleLayers[0].mapStyle){
                    setCurrentMapStyle(currentVisibleLayers[0].mapStyle);
                }
            }
        },
        [currentVisibleLayers, currentMapScale, currentMapStyle]
    );

    const [registeredDatasetLayers, setRegisteredDatasetLayers] = useState<
        readonly RegisteredLayer[]
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

        currentVisibleLayers.forEach(({ datasetId, dataLayer }) => {
            const visibleMapLayer = registeredDatasetLayers.find(
                (x) => x.datasetId === datasetId && x.dataLayer === dataLayer
            )?.mapLayer;

            // If layer could not be found, skip
            if (visibleMapLayer === undefined) {
                return;
            }

            // Otherwise push to array
            visibleMapLayers.push(visibleMapLayer);
        });

        return visibleMapLayers;
    }, [currentVisibleLayers, registeredDatasetLayers, currentMapScale, currentMapStyle]);

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

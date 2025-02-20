import React, { useEffect, useState } from "react";
import axios from "axios";
import { H4, H6, Icon, Pre } from "@blueprintjs/core";

import { useKeycloakInfo } from "../util/keycloak";
import { getDataExplorerBackendServerUrl } from "../util/env";
import { Dataset } from "../interfaces/Dataset";

export interface Props {
    datasetId: string;
}

export default function MetadataView({ datasetId }: Props) {
    const { keycloak } = useKeycloakInfo();
    const keycloakToken = keycloak?.token;

    const [metadata, setMetadata] = useState<
        | { type: "dataset"; data: Dataset }
        | { type: "error"; error: any }
        | undefined
    >(undefined);

    useEffect(
        function loadMetadata() {
            const cancellationToken = axios.CancelToken.source();
            // console.log("datasetId", datasetId);
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
        case undefined: {
            return <p>Please wait while we fetch this dataset...</p>;
        }

        case "error": {
            return (
                <div>
                    <H4>
                        <Icon icon="error" intent="danger" /> Error
                    </H4>
                    <p>An error occurred when fetching this dataset</p>
                </div>
            );
        }

        case "dataset": {            
            const data = metadata.data;
            const bccvlMetadata = data["bccvl:metadata"];

            const description = bccvlMetadata.description;
            const categoryVariables= data.parameters ? Object.entries(data.parameters)?.[0][1]?.categoryEncoding : null
            const displayedMetadata = {
                // Species
                "Scientific name": Array.isArray(bccvlMetadata.scientificName) ? bccvlMetadata.scientificName?.join(" ") : bccvlMetadata.scientificName,
                // Raster
                Resolution: bccvlMetadata.resolution,
                Description: bccvlMetadata.description,
                Mimetype: bccvlMetadata.mimetype,
                Layers: data.rangeAlternates["dmgr:tiff"] && (
                    <ul>
                        {Object.entries(data.rangeAlternates["dmgr:tiff"]).map(
                            ([layer, data]) => (
                                <li key={layer}>
                                    <b>{layer}</b>
                                    <Pre>{JSON.stringify(data, null, 2)}</Pre>
                                </li>
                            )
                        )}
                    </ul>
                ),
                "Variables": categoryVariables && Object.keys(categoryVariables).join(","),
                // Dataset
                "Year range":
                    bccvlMetadata.year_range &&
                    `${bccvlMetadata.year_range[0]} to ${bccvlMetadata.year_range[1]}`,
                Domain: bccvlMetadata.domain,
                Genre: bccvlMetadata.genre,
                Categories: Array.isArray(bccvlMetadata.categories) ? bccvlMetadata.categories.join(" ") : bccvlMetadata.categories,
                // Citation, referencing and licensing
                DOI: bccvlMetadata.doi,
                Attributions: bccvlMetadata.attributions && (
                    <ul>
                        {bccvlMetadata.attributions.map(({ type, value }) => (
                            <li key={type + value}>
                                <b>{type}</b>
                                <p>{value}</p>
                            </li>
                        ))}
                    </ul>
                ),
                Acknowledgement: bccvlMetadata.acknowledgement,
                License: bccvlMetadata.license,
                Rights: bccvlMetadata.rights,
                "Landing page": bccvlMetadata.landingpage && (
                    <a href={bccvlMetadata.landingpage} target="_blank">
                        {bccvlMetadata.landingpage}
                    </a>
                ),
                "Dataset UUID": bccvlMetadata.uuid
            };

            return (
                <div data-testid="metadata-view">
                    {description && <p>{description}</p>}
                    <ul>
                        {Object.entries(displayedMetadata).map(
                            ([field, value]) =>
                                value && (
                                    <li key={field}>
                                        <b>{field}</b>
                                        {typeof value === "string" ? (
                                            <p>{value}</p>
                                        ) : (
                                            <div>{value}</div>
                                        )}
                                    </li>
                                )
                        )}
                    </ul>
                </div>
            );
        }
    }
}

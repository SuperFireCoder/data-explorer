import { useEffect, useState } from "react";
import axios from "axios";
import { H4, H6, Icon } from "@blueprintjs/core";

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

            const displayedMetadata = {
                // Species
                "Scientific name": bccvlMetadata.scientificName?.join(" "),
                // Raster
                Resolution: bccvlMetadata.resolution,
                // Dataset
                "Year range":
                    bccvlMetadata.year_range &&
                    `${bccvlMetadata.year_range[0]} to ${bccvlMetadata.year_range[1]}`,
                Domain: bccvlMetadata.domain,
                Genre: bccvlMetadata.genre,
                Categories: bccvlMetadata.categories.join(" "),
                // Citation, referencing and licensing
                DOI: bccvlMetadata.doi,
                Attributions: bccvlMetadata.attributions && (
                    <ul>
                        {bccvlMetadata.attributions.map(({ type, value }) => (
                            <li key={type + value}>
                                <H6>{type}</H6>
                                <p>{value}</p>
                            </li>
                        ))}
                    </ul>
                ),
                Acknowledgement: bccvlMetadata.acknowledgement,
                License: bccvlMetadata.license,
                "Landing page": bccvlMetadata.landingpage && (
                    <a href={bccvlMetadata.landingpage} target="_blank">
                        {bccvlMetadata.landingpage}
                    </a>
                ),
            };

            return (
                <div>
                    {description && <p>{description}</p>}
                    <ul>
                        {Object.entries(displayedMetadata).map(
                            ([field, value]) =>
                                value && (
                                    <li key={field}>
                                        <H6>{field}</H6>
                                        <p>{value}</p>
                                    </li>
                                )
                        )}
                    </ul>
                </div>
            );
        }
    }
}

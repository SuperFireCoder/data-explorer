import { useEffect, useState } from "react";
import axios from "axios";

import { useKeycloakInfo } from "../util/keycloak";
import { getDataExplorerBackendServerUrl } from "../util/env";

export interface Props {
    datasetId: string;
}

export default function MetadataView({ datasetId }: Props) {
    const { keycloak } = useKeycloakInfo();
    const keycloakToken = keycloak?.token;

    const [metadata, setMetadata] = useState<any | undefined>(undefined);

    useEffect(
        function loadMetadata() {
            const cancellationToken = axios.CancelToken.source();

            (async () => {
                const { data } = await axios.get(
                    `${getDataExplorerBackendServerUrl()}/api/dataset/${datasetId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${keycloakToken}`,
                        },
                    }
                );

                setMetadata(data);
            })().catch((e) => {
                // Ignore cancellation
                if (axios.isCancel(e)) {
                    return;
                }

                throw e;
            });

            return function stopLoadMetadata() {
                cancellationToken.cancel();
            };
        },
        [keycloakToken, datasetId]
    );

    if (!metadata) {
        return <div>Loading...</div>;
    }

    return <pre>{JSON.stringify(metadata, null, 2)}</pre>;
}

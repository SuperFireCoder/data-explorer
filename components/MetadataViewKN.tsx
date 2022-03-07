import { useEffect, useState } from "react";
import axios from "axios";
import { H4, Icon } from "@blueprintjs/core";

import { DatasetKN } from "../interfaces/DatasetKN";

export interface Props {
    datasetId: string;
}

export default function MetadataViewKN({ datasetId }: Props) {
    const [metadata, setMetadata] = useState<
        | { type: "dataset"; data: DatasetKN }
        | { type: "error"; error: any }
        | undefined
    >(undefined);

    useEffect(
        function loadMetadata() {
            const cancellationToken = axios.CancelToken.source();
            // console.log("datasetId", datasetId);
            (async () => {
                try {
                    // The dataset ID should be escaped as it can contain some
                    // characters like colons (:) and slashes (/)
                    const escapedDatasetId =
                        window.encodeURIComponent(datasetId);

                    const { data } = await axios.get(
                        `https://knowledgenet.co/api/v0/registry/records/${escapedDatasetId}?aspect=dcat-dataset-strings&optionalAspect=organization-details&optionalAspect=dataset-publisher&optionalAspect=source&dereference=true`
                    );

                    setMetadata({ type: "dataset", data });

                    // console.log('kn data meta', metadata)
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
        [datasetId]
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

            const generalDetails = data?.aspects["dcat-dataset-strings"];
            const orgDetails =
                data?.aspects["dataset-publisher"]?.publisher?.aspects[
                    "organization-details"
                ];
            const description =
                data.aspects["dcat-dataset-strings"]?.description;
            const source = data?.aspects?.source;

            const displayedMetadata = {
                "Source name": source?.name,
                Publisher: generalDetails?.publisher,
                "Organization Details": (
                    <ul>
                        <li>
                            <b>Organization name: </b>
                            {orgDetails?.name || " - "}
                        </li>
                        <li>
                            <b>Email: </b>
                            {orgDetails?.email || " - "}
                        </li>
                        <li>
                            <p>
                                <b>Address</b>
                            </p>
                            <p>
                                <b>Street: </b>
                                {orgDetails?.addrStreet || " - "}
                            </p>
                            <p>
                                <b>Suburb: </b>
                                {orgDetails?.addrSuburb || " - "}
                            </p>
                            <p>
                                <b>State: </b>
                                {orgDetails?.addrState || " - "}
                            </p>
                            <p>
                                <b>Postcode: </b>
                                {orgDetails?.addrPostCode || " - "}
                            </p>
                            <p>
                                <b>Country: </b>
                                {orgDetails?.addrCountry || " - "}
                            </p>
                        </li>
                    </ul>
                ),
                "Contact point": generalDetails?.contactPoint,
            };

            return (
                <div data-testid="metadata-view">
                    {description && (
                        <>
                            <h4>{"Description"}</h4>
                            <p>{description}</p>
                        </>
                    )}
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

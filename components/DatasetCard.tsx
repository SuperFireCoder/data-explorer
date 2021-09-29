import { Button, ButtonGroup, Card, Classes, H5 } from "@blueprintjs/core";
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import { ReactNode, useCallback, useMemo, useState } from "react";
import axios from "axios";

import { DatasetType } from "../interfaces/DatasetType";
import { getDDMMMYYYY } from "../util/date";
import { useDataManager } from "../hooks/DataManager";

import DatasetTypeIndicator from "./DatasetTypeIndicator";
import MetadataDrawer from "./MetadataDrawer";
import VisualiserDrawer from "./VisualiserDrawer";

import styles from "./DatasetCard.module.css";

export interface Props {
    /** ID of dataset to load for metadata view, etc. */
    datasetId: string;
    /** Title of the dataset */
    title: string;
    /** Description of the dataset */
    description: ReactNode;
    /** Type of the dataset */
    type?: DatasetType;
    /** Date the dataset was last updated */
    lastUpdated?: Date;
    /** Status of the dataset import */
    status: "SUCCESS" | "IMPORTING" | "FAILED" | "CREATED";
    /** Import failure message */
    failureMessage?: string;
}

export default function DatasetCard({
    datasetId,
    title,
    description,
    type,
    lastUpdated,
    status,
    failureMessage,
}: Props) {
    const dataManager = useDataManager();

    const [metadataDrawerOpen, setMetadataDrawerOpen] =
        useState<boolean>(false);

    const [downloadInProgress, setDownloadInProgress] =
        useState<boolean>(false);

    const disabledDataset = useMemo(() => {
        return status !== "SUCCESS";
    }, [status]);

    const openMetadataDrawer = useCallback(
        () => setMetadataDrawerOpen(true),
        []
    );

    const closeMetadataDrawer = useCallback(
        () => setMetadataDrawerOpen(false),
        []
    );

    const [visualiserDrawerOpen, setVisualiserDrawerOpen] =
        useState<boolean>(false);

    const openVisualiserDrawer = useCallback(
        () => setVisualiserDrawerOpen(true),
        []
    );

    const closerVisualiserDrawer = useCallback(
        () => setVisualiserDrawerOpen(false),
        []
    );

    const downloadDataset = useCallback(async () => {
        if (dataManager === undefined) {
            throw new Error("Data Manager must be available for download");
        }

        try {
            const { promise } = dataManager.getDatasetTemporaryUrl(datasetId);

            setDownloadInProgress(true);

            const { url } = await promise;

            // Go to returned URL to trigger download
            window.location.href = url;
        } catch (e) {
            // Ignore cancellation events
            if (axios.isCancel(e)) {
                return;
            }

            console.error(e);
            alert(e.toString());
        } finally {
            setDownloadInProgress(false);
        }
    }, [datasetId, dataManager]);

    // TODO: Implement our own maximum character limit for description to clip
    // the amount of text being stuffed into DOM and potentially spilling over
    // for users of browsers not supporting the `line-clamp` CSS property
    return (
        <>
            <Card className={styles.datasetCard}>
                <Row justify="between">
                    <Col>
                        <H5
                            className={classnames({
                                [Classes.TEXT_DISABLED]: status === "FAILED",
                            })}
                        >
                            {title}
                        </H5>
                        {status === "IMPORTING" && (
                            <p
                                className={classnames(
                                    styles.description,
                                    Classes.TEXT_DISABLED
                                )}
                            >
                                Importing...
                            </p>
                        )}
                        {status === "FAILED" && (
                            <>
                                <p
                                    className={classnames(
                                        styles.description,
                                        Classes.TEXT_DISABLED
                                    )}
                                >
                                    {failureMessage ??
                                        "Dataset failed to import"}
                                </p>
                            </>
                        )}
                        <p
                            className={classnames(
                                styles.description,
                                "bp3-ui-text"
                            )}
                        >
                            {description}
                        </p>
                        {type && (
                            <p className="bp3-text-small" data-testid="type">
                                <DatasetTypeIndicator type={type} />
                            </p>
                        )}
                        {lastUpdated && (
                            <div
                                className="bp3-text-small bp3-text-disabled"
                                data-testid="last-updated-date"
                            >
                                Updated: {getDDMMMYYYY(lastUpdated)}
                            </div>
                        )}
                    </Col>
                    <Col style={{ flexGrow: 0 }}>
                        <ButtonGroup vertical alignText="left">
                            <Button
                                icon="document-open"
                                data-testid="view-button"
                                intent="success"
                                onClick={openVisualiserDrawer}
                                disabled={disabledDataset}
                            >
                                View
                            </Button>
                            <Button
                                icon="info-sign"
                                data-testid="info-button"
                                intent="primary"
                                onClick={openMetadataDrawer}
                                disabled={disabledDataset}
                            >
                                Info
                            </Button>
                            <Button
                                icon="download"
                                intent="warning"
                                onClick={downloadDataset}
                                loading={downloadInProgress}
                                disabled={disabledDataset}
                            >
                                Download
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
            </Card>
            <MetadataDrawer
                drawerTitle={title}
                datasetId={datasetId}
                isOpen={metadataDrawerOpen}
                onClose={closeMetadataDrawer}
            />
            <VisualiserDrawer
                drawerTitle={title}
                datasetId={datasetId}
                isOpen={visualiserDrawerOpen}
                onClose={closerVisualiserDrawer}
            />
        </>
    );
}

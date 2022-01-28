import {
    Button,
    ButtonGroup,
    Card,
    Classes,
    H5,
    Menu,
    MenuItem,
    Popover,
    Position,
} from "@blueprintjs/core";
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import { ReactNode, useCallback, useMemo, useState } from "react";
import axios from "axios";

import { DatasetType } from "../interfaces/DatasetType";
import { getDDMMMYYYY } from "../util/date";
import { useDataManager } from "../hooks/DataManager";
import { useOpenableOpen } from "../hooks/Openable";

import DatasetTypeIndicator from "./DatasetTypeIndicator";
import MetadataDrawer from "./MetadataDrawer";
import VisualiserDrawer from "./VisualiserDrawer";

import { useTheme } from "@ecocommons-australia/ui-library";

import styles from "./DatasetCard.module.css";
import DatasetSharingDrawer from "./DatasetSharingDrawer";
import { useKeycloakInfo } from "../util/keycloak";

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
    /** User ID of the owner of the dataset */
    ownerId: string | string[];
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
    ownerId,
    status,
    failureMessage,
}: Props) {
    const { keycloak } = useKeycloakInfo();
    const dataManager = useDataManager();
    const { mergeStyles } = useTheme();

    const themedStyles = mergeStyles(styles, "Styles::DatasetCard");
    
    const currentUserId = keycloak?.tokenParsed?.sub;

    const [downloadInProgress, setDownloadInProgress] =
        useState<boolean>(false);

    const disabledDataset = useMemo(() => {
        return status !== "SUCCESS";
    }, [status]);

    const {
        isOpen: metadataDrawerOpen,
        open: openMetadataDrawer,
        close: closeMetadataDrawer,
    } = useOpenableOpen();

    const {
        isOpen: visualiserDrawerOpen,
        open: openVisualiserDrawer,
        close: closeVisualiserDrawer,
    } = useOpenableOpen();

    const {
        isOpen: sharingDrawerOpen,
        open: openSharingDrawer,
        close: closeSharingDrawer,
    } = useOpenableOpen();

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
            <Card className={themedStyles.datasetCard}>
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
                                    themedStyles.description,
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
                                        themedStyles.description,
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
                                themedStyles.description,
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
                    <Col xs="content">
                        <ButtonGroup vertical alignText="left">
                            <Button
                                icon="eye-open"
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
                            <Popover
                                content={
                                    <Menu>
                                        <MenuItem
                                            icon="download"
                                            text="Download"
                                            onClick={downloadDataset}
                                            disabled={disabledDataset}
                                        />
                                        <MenuItem
                                            icon="share"
                                            text="Share..."
                                            onClick={openSharingDrawer}
                                            disabled={
                                                disabledDataset ||
                                                // Disable sharing when user is not owner
                                                currentUserId === undefined ||
                                                typeof ownerId === "string"
                                                    ? ownerId !== currentUserId
                                                    : !ownerId.includes(
                                                          currentUserId
                                                      )
                                            }
                                        />
                                    </Menu>
                                }
                                position={Position.BOTTOM_RIGHT}
                            >
                                <Button
                                    icon="more"
                                    intent="none"
                                    disabled={disabledDataset}
                                >
                                    More
                                </Button>
                            </Popover>
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
                onClose={closeVisualiserDrawer}
            />
            <DatasetSharingDrawer
                datasetName={title}
                datasetId={datasetId}
                isOpen={sharingDrawerOpen}
                onClose={closeSharingDrawer}
            />
        </>
    );
}

import {
    AnchorButton,
    Alert,
    Button,
    ButtonGroup,
    Card,
    Classes,
    H5,
    Menu,
    MenuItem,
    Popover,
    Position,
    Spinner,
    SpinnerSize,
    Icon,
} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons"
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

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
import { usePinnedDataStore } from "./../hooks/PinnedDataStore";

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
    /** Indicate if a dataset is downloadable or not */
    downloadable?: boolean
    /** User ID of the owner of the dataset */
    ownerId?: string[];
    /** Status of the dataset import */
    status: "SUCCESS" | "IMPORTING" | "FAILED" | "CREATED";
    /** Is pinned by user */
    isPinned?: boolean;
    /** Import failure message */
    failureMessage?: string;
    /**
     * URL to resource landing page; should only be used with Knowledge Network
     * data
     */
    landingPageUrl?: string;
    /** Allow dataset cards to be selected */
    selected?: boolean;
    onSelect?: (uuid: string) => void;
    setDatasetUUIDToDelete: React.Dispatch<React.SetStateAction<string | undefined>>;
    setDatasetUUIDToUnshare: React.Dispatch<React.SetStateAction<string | undefined>>;
    acl?: { [K: string]: any };
}
const dataStore = usePinnedDataStore.getState();


export default function DatasetCard({
    datasetId,
    title,
    description,
    type,
    lastUpdated,
    ownerId,
    status,
    isPinned,
    downloadable,
    failureMessage,
    landingPageUrl,
    selected,
    onSelect,
    setDatasetUUIDToDelete,
    setDatasetUUIDToUnshare,
    acl={},
}: Props) {
    const { keycloak } = useKeycloakInfo();

    const { dataManager } = useDataManager();
    const dataStore = usePinnedDataStore.getState();
    const { mergeStyles } = useTheme();
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState("");
    const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);

    // Set pinned by prop if available otherwise use data store.
    const [pinned, setPinned] = useState(
        isPinned !== undefined ?  isPinned : dataStore.isDatasetPinned(datasetId)
        );

    const handleTogglePin = () => {
        if (pinned){
            const { promise: unPinnedDataPromise } = dataManager.unPinDataset(datasetId)
            unPinnedDataPromise
                .then(() => {
                    dataStore.removeDataset(datasetId)
                    dataStore.removeFilteredPinnedDataset(datasetId)
                    if (dataStore.isPinnedPage){
                        setDatasetUUIDToDelete(datasetId)
                        setDatasetUUIDToUnshare(datasetId)
                    }
            })
        }
        else {
            // const pinnedData = dataManager.pinDataset(datasetId)
            const { promise: pinnedDataPromise } = dataManager.pinDataset(datasetId)

            pinnedDataPromise
                .then((pinnedData) => {
                    dataStore.addDataset(pinnedData[0])
                    dataStore.addFilteredPinnedDataset(pinnedData[0])
            })
        }
        setPinned(!pinned);
      };

    const showInfoView = router?.query.showInfo === "1";
    const datasetIdUrl = router?.query.datasetId;
    
    const themedStyles = mergeStyles(styles, "Styles::DatasetCard");

    const currentUserId = keycloak?.tokenParsed?.sub;

    const [downloadInProgress, setDownloadInProgress] =
        useState<boolean>(false);

    const [isDeleteInProgress, setIsDeleteInProgress] = useState<boolean>(false);

    const disabledDataset = useMemo<boolean>(() => {
        //Return True if upload status is not succes
        return status !== "SUCCESS" || isDeleteInProgress ;
    }, [status, isDeleteInProgress]);

    const disabledView = useMemo<boolean>(() => {
        // Return True if dataset can not be visualised
        return type?.type === "others"
            && (type?.subtype === 'spatialShape' || type?.subtype === 'file');
    }, [type]);

    const disabledDelete = () => {
        //Return True if upload status is not SUCCESS, FAILED, CREATED, or delete process in progress.
        return !['SUCCESS', 'FAILED', 'CREATED'].includes(status)  || isDeleteInProgress
    };

    const disabledOptions = (ownerId: string | string[] | undefined) => {
        // Disable deleting and Sharing when user is not owner
        return currentUserId === undefined ||
            typeof ownerId === "string" ? ownerId !== currentUserId : !ownerId?.includes(currentUserId)
    };

    const isDatasetShared = (ownerId: string | string[] | undefined) => {
        // Remove Shared dataset when user want to unshare
        return currentUserId === undefined ||
            typeof ownerId === "string" ? false : !ownerId?.includes(currentUserId) && !ownerId?.includes("role:admin")
    };

    const renderViewTitle = useMemo(() => {
        return disabledView ? "This dataset cannot be currently visualised" : ""
    }, [disabledView]);

    useEffect(() => {
        if (datasetIdUrl && showInfoView) {
            openMetadataDrawer()
        }
    }, [])

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

            const { url, status } = await promise;

            let instatus = status;
            let inurl = url;
            while (instatus == 'IN-PROGRESS') {
                // Wait for a few seconds before prompt for status
                await new Promise(r => setTimeout(r, 2000));
                const { promise } = dataManager.getDatasetFileStatus(inurl);
                const { url, status } = await promise;
                instatus = status;
                inurl = url;
            }

            // Go to returned URL to trigger download
            if (instatus == 'COMPLETED') {
                window.location.href = inurl;
            }
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

    const unShareDataset = () => {
      // this is set to remove the dataset card from dataset list
      setIsDeleteInProgress(true);
      if (dataManager === undefined) {
        throw new Error("Data Manager must be available for download");
      }
      dataManager
        .updateShareDatasetUsers(datasetId)
        .promise.then(() => {
          setIsDeleteInProgress(false);
          setDatasetUUIDToUnshare(datasetId);
          dataStore.removeDataset(datasetId);
        })
        .catch((error) => {
          setErrorMessage(error.code + " : " + error.title);
          setIsErrorAlertOpen(true);
        });
    };


    const removeUserOwnDataset = () => {
            setIsDeleteInProgress(true)
            dataManager.removeDataset(datasetId)
                .promise.then(() => {
                    setIsDeleteInProgress(false);
                    setDatasetUUIDToDelete(datasetId)
                    dataStore.removeDataset(datasetId)
                })
                .catch(error => {
                    setErrorMessage(error.code + " : " + error.title);
                    setIsErrorAlertOpen(true);
                    setIsDeleteInProgress(false)
                })
    }

    const displayFilureMessage = useMemo(() => {
        // keep this function for personalised message in the future
        return "Dataset failed to import"
    }, [failureMessage])

    const isDownloadDisabled: boolean = useMemo(() => {
        // owned dataset or public dataset
        if (currentUserId !== undefined) {
            if (ownerId === undefined || ownerId.includes('role:admin') || ownerId.includes(currentUserId)) {
                if (downloadable && !disabledDataset) {
                    return false
                }
            } else if (!ownerId.includes(currentUserId)) { // shared dataset
                if (downloadable && !disabledDataset && acl[currentUserId]?.includes("download_ds")) {
                    return false
                }
            }
        }
        return true
    }, [downloadable, disabledDataset, currentUserId, acl])
    
    // TODO: Implement our own maximum character limit for description to clip
    // the amount of text being stuffed into DOM and potentially spilling over
    // for users of browsers not supporting the `line-clamp` CSS property
    return (
        <>
            {isErrorAlertOpen && (
            <Alert
                intent="danger"
                isOpen={isErrorAlertOpen}
                onClose={() => setIsErrorAlertOpen(false)}
                >
                <p>{errorMessage}</p>
            </Alert>
            )}
            <Card
                className={classnames({
                    [themedStyles.datasetCard]: true,
                    [themedStyles.datasetCardSelected]: selected === true
                })}
                data-cy="DatasetCard-card"
                data-testid={title}
                data-selected={selected}
            >
            {isDeleteInProgress ? 
                <Row justify="between"><Col><Spinner size={SpinnerSize.LARGE} /></Col></Row>
            :
                <Row justify="between">
                    <Col>
                        <H5
                            data-cy="dataset-heading-data"
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
                                    {displayFilureMessage}
                                </p>
                            </>
                        )}
                        <p
                            className={classnames(
                                themedStyles.description,
                                "bp5-ui-text"
                            )}
                        >
                            {description}
                        </p>
                        {status === "FAILED" && (
                            <p className="bp5-text-small" data-testid="type">
                                <DatasetTypeIndicator type={
                                    ({
                                        type: "failed",
                                        subtype: "Import Failed"
                                    } as unknown as DatasetType)
                                } />
                            </p>
                        )}
                        {type && (
                            <p className="bp5-text-small" data-testid="type">
                                <DatasetTypeIndicator type={type} />
                            </p>
                        )}
                        {lastUpdated && (
                            <div
                                className="bp5-text-small bp5-text-disabled"
                                data-testid="last-updated-date"
                            >
                                Updated: {getDDMMMYYYY(lastUpdated)}
                            </div>
                        )}
                    </Col>
                    {keycloak?.authenticated === true && (
                        <Icon
                            icon={pinned ? IconNames.STAR : IconNames.STAR_EMPTY}
                            onClick={handleTogglePin}
                            color={pinned ? "#e1a96a" : ""}
                            style={{ cursor: "pointer" }}
                        />
                    )}

                    <Col xs="content">
                        <ButtonGroup vertical alignText="left">
                            {onSelect ?
                                <Button
                                    icon={selected ? 'tick-circle' : 'circle'}
                                    data-cy="select-button"
                                    data-testid="select-button"
                                    intent={selected ? 'success' : 'none'}
                                    onClick={() => onSelect(datasetId)}
                                    disabled={disabledDataset}
                                >
                                    Select
                                </Button>
                                : ''}
                            {status === "CREATED" ?
                                <Button
                                    icon="eye-open"
                                    intent={onSelect ? 'primary' : 'success'}
                                >
                                    In Progress
                                </Button> :
                                <Button
                                    icon="eye-open"
                                    data-cy="view-button"
                                    data-testid="view-button"
                                    intent={onSelect ? 'primary' : 'success'}
                                    onClick={openVisualiserDrawer}
                                    disabled={disabledDataset || disabledView}
                                    title={renderViewTitle}
                                >
                                    View
                                </Button>
                            }
                            <Button
                                icon="info-sign"
                                data-cy="info-button"
                                data-testid="info-button"
                                intent="primary"
                                onClick={openMetadataDrawer}
                                disabled={disabledDataset}
                            >
                                Info
                            </Button>
                            {onSelect === undefined ?
                                <Popover
                                    content={
                                        <Menu>
                                            {currentUserId !== undefined &&
                                                <MenuItem
                                                    icon="download"
                                                    text="Download"
                                                    onClick={downloadDataset}
                                                    disabled={isDownloadDisabled}
                                                    data-cy="download-button"
                                                    data-testid="download-button"
                                                />
                                            }
                                            {
                                                <><MenuItem
                                                    icon="delete"
                                                    text="Delete"
                                                    onClick={removeUserOwnDataset}
                                                    disabled={disabledOptions(ownerId)} />
                                                   <MenuItem
                                                      icon="share"
                                                      text="Share..."
                                                      onClick={openSharingDrawer}
                                                      disabled={disabledDataset || disabledOptions(ownerId)} />
                                                </>
                                            }
                                            {isDatasetShared((ownerId)) &&
                                                   <MenuItem
                                                      icon="cube-remove"
                                                      text="Unshare..."
                                                      onClick={unShareDataset}
                                                    />
                                            }
                                        </Menu>
                                    }
                                    position={Position.BOTTOM_RIGHT}
                                >
                                    <Button
                                        icon="more"
                                        intent="none"
                                        disabled={disabledDelete()}
                                        data-cy="more-button"
                                        data-testid="more-button"
                                    >
                                        More
                                    </Button>
                                </Popover>
                                : ''}
                        </ButtonGroup>
                    </Col>
                </Row> }
            </Card>
            <MetadataDrawer
                drawerTitle={title}
                datasetId={datasetId}
                isOpen={metadataDrawerOpen}
                onClose={closeMetadataDrawer}
                exploreDataType="dataExplorer"
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

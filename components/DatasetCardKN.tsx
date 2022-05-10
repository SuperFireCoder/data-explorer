import { AnchorButton, Button, ButtonGroup, Card, H5 } from "@blueprintjs/core";
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import { ReactNode } from "react";

import { DatasetType } from "../interfaces/DatasetType";
import { getDDMMMYYYY } from "../util/date";
import { useOpenableOpen } from "../hooks/Openable";

import DatasetTypeIndicator from "./DatasetTypeIndicator";
import MetadataDrawer from "./MetadataDrawer";

import styles from "./DatasetCard.module.css";
import { EsDatasetKN } from "../interfaces/EsDatasetKN";
import GetDataDrawerKN from "./GetDataDrawerKN";

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
    /**
     * URL to resource landing page; should only be used with Knowledge Network
     * data
     */
    landingPageUrl?: string;
    /** Content of the `distributions` array */
    distributions: Readonly<EsDatasetKN["distributions"]>;
}

export default function DatasetCardKN({
    datasetId,
    title,
    description,
    type,
    lastUpdated,
    landingPageUrl,
    distributions = [],
}: Props) {
    const {
        isOpen: metadataDrawerOpen,
        open: openMetadataDrawer,
        close: closeMetadataDrawer,
    } = useOpenableOpen();

    const {
        isOpen: getDataDrawerOpen,
        open: openGetDataDrawer,
        close: closeGetDataDrawer,
    } = useOpenableOpen();

    // TODO: Implement our own maximum character limit for description to clip
    // the amount of text being stuffed into DOM and potentially spilling over
    // for users of browsers not supporting the `line-clamp` CSS property
    return (
        <>
            <Card className={styles.datasetCard}>
                <Row justify="between">
                    <Col>
                        <H5>{title}</H5>
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
                    <Col xs="content">
                        <ButtonGroup vertical alignText="left">
                            <AnchorButton
                                icon="eye-open"
                                data-testid="view-button"
                                intent="success"
                                href={landingPageUrl}
                                target="_blank"
                                disabled={landingPageUrl === undefined}
                            >
                                View
                            </AnchorButton>
                            <Button
                                icon="info-sign"
                                data-testid="info-button"
                                intent="primary"
                                onClick={openMetadataDrawer}
                            >
                                Info
                            </Button>
                            <Button
                                icon="download"
                                disabled={distributions.length === 0}
                                onClick={openGetDataDrawer}
                            >
                                Get Data
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
                exploreDataType="knowledgeNetwork"
            />
            <GetDataDrawerKN
                drawerTitle={title}
                distributions={distributions}
                isOpen={getDataDrawerOpen}
                onClose={closeGetDataDrawer}
            />
        </>
    );
}

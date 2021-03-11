import { Button, ButtonGroup, Card, H3 } from "@blueprintjs/core";
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import { ReactNode, useCallback, useState } from "react";
import { DatasetType } from "../interfaces/DatasetType";
import { getDDMMMYYYY } from "../util/date";
import DatasetTypeIndicator from "./DatasetTypeIndicator";
import MetadataDrawer from "./MetadataDrawer";

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
}

export default function DatasetCard({
    datasetId,
    title,
    description,
    type,
    lastUpdated,
}: Props) {
    const [metadataDrawerOpen, setMetadataDrawerOpen] = useState<boolean>(
        false
    );

    const openMetadataDrawer = useCallback(
        () => setMetadataDrawerOpen(true),
        []
    );

    const closeMetadataDrawer = useCallback(
        () => setMetadataDrawerOpen(false),
        []
    );

    // TODO: Implement our own maximum character limit for description to clip
    // the amount of text being stuffed into DOM and potentially spilling over
    // for users of browsers not supporting the `line-clamp` CSS property
    return (
        <>
            <Card className={styles.datasetCard}>
                <Row justify="between">
                    <Col>
                        <H3>{title}</H3>
                        <p
                            className={classnames(
                                styles.description,
                                "bp3-ui-text"
                            )}
                        >
                            {description}
                        </p>
                        {type && (
                            <p className="bp3-text-small">
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
                            <Button icon="document-open" intent="success">
                                View
                            </Button>
                            <Button
                                icon="info-sign"
                                intent="primary"
                                onClick={openMetadataDrawer}
                            >
                                Info
                            </Button>
                            <Button icon="download" intent="warning">
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
        </>
    );
}

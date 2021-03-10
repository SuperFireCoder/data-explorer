import {
    Button,
    ButtonGroup,
    Card,
    Drawer,
    Classes,
    H3,
    Position,
} from "@blueprintjs/core";
import classnames from "classnames";
import { Col, Row } from "react-grid-system";
import { ReactNode, useState } from "react";
import { DatasetType } from "../interfaces/DatasetType";
import { getDDMMMYYYY } from "../util/date";
import DatasetTypeIndicator from "./DatasetTypeIndicator";
import MetadataView from "./MetadataView";

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
    const [metadataOpen, setMetadataOpen] = useState<boolean>(false);

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
                                onClick={() => setMetadataOpen(true)}
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
            <Drawer
                icon="info-sign"
                onClose={() => setMetadataOpen(false)}
                title={title}
                autoFocus
                canEscapeKeyClose
                canOutsideClickClose
                enforceFocus
                hasBackdrop
                isOpen={metadataOpen}
                position={Position.RIGHT}
                size="50%"
                usePortal
            >
                <div className={Classes.DRAWER_BODY}>
                    <div className={Classes.DIALOG_BODY}>
                        <MetadataView datasetId={datasetId} />
                    </div>
                </div>
                {/* <div className={Classes.DRAWER_FOOTER}>Footer</div> */}
            </Drawer>
        </>
    );
}

import {
    Button,
    Callout,
    Card,
    Classes,
    Collapse,
    H5,
    Tab,
    Tabs,
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import classnames from "classnames";
import React, { useMemo } from "react";
import { useOpenableOpen } from "../hooks/Openable";
import { Distribution } from "../interfaces/EsDatasetKN";
import GetDataCodeBlock from "./GetDataCodeBlock";
import styles from "./GetDataDrawerCardKN.module.css";

export interface Props {
    distribution: Distribution;
}

/**
 * Array of supported file types for snippets
 */
const DOWNLOAD_SUPPORTED_TYPES = [
    "PDF",
    "ZIP",
    "TIFF",
    "XLSX",
    "CSV",
    "JPEG",
    "DOCX",
    "PLAIN",
    "XML",
];

export default function GetDataDrawerCardKN({ distribution }: Props) {
    const { isOpen, open, close } = useOpenableOpen();

    const detectedUrl = useMemo(() => {
        // First use the download URL where available
        if (distribution.downloadURL) {
            return {
                url: distribution.downloadURL,
                type: "download-url",
            };
        }

        // Then try the access URL
        if (distribution.accessURL) {
            return {
                url: distribution.accessURL,
                type: "access-url",
            };
        }

        // Otherwise return no URL
        return {
            url: undefined,
            type: "no-url",
        };
    }, [distribution.downloadURL, distribution.accessURL]);

    const suggestedFilename = useMemo(() => {
        // Get the "filename" from the URL where possible, after removal of query
        // string or anchor
        //
        // If the string is blank, then we return the distribution ID
        const { url } = detectedUrl;

        return (
            url?.split(/[?#]/)[0].replace(/^.*[\\/]/, "") ??
            distribution.identifier
        );
    }, [detectedUrl, distribution.identifier]);

    const isUnsupportedDataType = useMemo(() => {
        return !DOWNLOAD_SUPPORTED_TYPES.includes(distribution.format!);
    }, [distribution.format]);

    return (
        <Card>
            <Row disableDefaultMargins align="center">
                <Col>
                    <H5 style={{ wordBreak: "break-all", margin: 0 }}>
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                (isOpen ? close : open)();
                            }}
                        >
                            {distribution.title}
                        </a>
                    </H5>
                </Col>
                <Col xs="content">
                    <Button
                        minimal
                        small
                        icon={isOpen ? "minus" : "plus"}
                        onClick={isOpen ? close : open}
                    />
                </Col>
            </Row>
            <Collapse isOpen={isOpen}>
                {detectedUrl.type === "no-url" && (
                    <Row>
                        <Col xs={12}>
                            <Callout intent="warning" icon="warning-sign">
                                No URL available for this data
                            </Callout>
                        </Col>
                    </Row>
                )}
                {detectedUrl.type === "access-url" && (
                    <Row>
                        <Col xs={12}>
                            <Callout intent="warning" icon="warning-sign">
                                Download code might not work as URL might only
                                be accessible as a web page in a web browser
                            </Callout>
                        </Col>
                    </Row>
                )}
                {detectedUrl.type === "download-url" && isUnsupportedDataType && (
                    <Row>
                        <Col xs={12}>
                            <Callout intent="warning" icon="warning-sign">
                                Download code might not work for this data type
                                (&ldquo;{distribution.format ?? "UNKNOWN FORMAT"}&rdquo;)
                            </Callout>
                        </Col>
                    </Row>
                )}
                {detectedUrl.type !== "no-url" && (
                    <Row style={{ marginBottom: 0 }}>
                        <Col xs={12}>
                            <Tabs
                                id={`code-snippets-${distribution.identifier}`}
                                defaultSelectedTabId="direct-access"
                            >
                                <span
                                    className={classnames(
                                        Classes.TAB,
                                        styles.methodLabelTab
                                    )}
                                >
                                    Method:
                                </span>
                                <Tab
                                    id="direct-access"
                                    title="Direct access"
                                    panel={
                                        <GetDataDirectAccess
                                            accessUrl={distribution.accessURL}
                                            downloadUrl={
                                                distribution.downloadURL
                                            }
                                        />
                                    }
                                />
                                <Tab
                                    id="python"
                                    title="Python code"
                                    panel={
                                        <GetDataCodeBlock
                                            language="python"
                                            url={detectedUrl.url ?? ""}
                                            filename={suggestedFilename}
                                            title={distribution.title}
                                            source={distribution.source?.name}
                                            landingPage={distribution.accessURL}
                                        />
                                    }
                                />
                                <Tab
                                    id="r"
                                    title="R code"
                                    panel={
                                        <GetDataCodeBlock
                                            language="r"
                                            url={detectedUrl.url ?? ""}
                                            filename={suggestedFilename}
                                            title={distribution.title}
                                            source={distribution.source?.name}
                                            landingPage={distribution.accessURL}
                                        />
                                    }
                                />
                                <Tab
                                    id="bash"
                                    title="Bash"
                                    panel={
                                        <GetDataCodeBlock
                                            language="bash"
                                            url={detectedUrl.url ?? ""}
                                            filename={suggestedFilename}
                                            title={distribution.title}
                                            source={distribution.source?.name}
                                            landingPage={distribution.accessURL}
                                        />
                                    }
                                />
                            </Tabs>
                        </Col>
                    </Row>
                )}
            </Collapse>
        </Card>
    );
}

interface GetDataDirectAccessProps {
    accessUrl?: string;
    downloadUrl?: string;
}

function GetDataDirectAccess({
    accessUrl,
    downloadUrl,
}: GetDataDirectAccessProps) {
    return (
        <div>
            <p>
                Click or copy the below URLs to access more information about
                this data or download the data.
            </p>

            <H5>Access URL</H5>
            <p>
                {accessUrl ? (
                    <a
                        href={accessUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        {accessUrl}
                    </a>
                ) : (
                    <span className={Classes.TEXT_DISABLED}>
                        No access URL available
                    </span>
                )}
            </p>

            <H5>Download URL</H5>
            <p>
                {downloadUrl ? (
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        {downloadUrl}
                    </a>
                ) : (
                    <span className={Classes.TEXT_DISABLED}>
                        No download URL available
                    </span>
                )}
            </p>
        </div>
    );
}

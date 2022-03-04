import {
    Button,
    Card,
    Classes,
    Collapse,
    H5,
    Tab,
    Tabs,
} from "@blueprintjs/core";
import { Col, Row } from "@ecocommons-australia/ui-library";
import { useMemo } from "react";
import { useOpenableOpen } from "../hooks/Openable";
import { Distribution } from "../interfaces/EsDatasetKN";
import GetDataCodeBlock from "./GetDataCodeBlock";

export interface Props {
    distribution: Distribution;
}

export default function GetDataDrawerCardKN({ distribution }: Props) {
    const { isOpen, open, close } = useOpenableOpen();

    const suggestedFilename = useMemo(() => {
        // Get the "filename" from the URL where possible, after removal of query
        // string or anchor
        //
        // If the string is blank, then we return the distribution ID
        return (
            distribution?.downloadURL
                ?.split(/[?#]/)[0]
                .replace(/^.*[\\/]/, "") ?? distribution.identifier
        );
    }, [distribution.downloadURL, distribution.identifier]);

    return (
        <Card>
            <Row disableDefaultMargins align="center">
                <Col>
                    <H5 style={{ wordBreak: "break-all", margin: 0 }}>
                        {distribution.title}
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
                <Row>
                    <Col xs={12}>
                        <Tabs
                            id={`code-snippets-${distribution.identifier}`}
                            defaultSelectedTabId="direct-download"
                        >
                            <span className={Classes.TAB}>
                                Download method:
                            </span>
                            <Tab
                                id="direct-download"
                                title="Direct download"
                                panel={<GetDataDirectDownload />}
                            />
                            <Tab
                                id="python"
                                title="Python code"
                                panel={
                                    <GetDataCodeBlock
                                        language="python"
                                        url={distribution.downloadURL ?? ""}
                                        filename={suggestedFilename}
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
                                        url={distribution.downloadURL ?? ""}
                                        filename={suggestedFilename}
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
                                        url={distribution.downloadURL ?? ""}
                                        filename={suggestedFilename}
                                        landingPage={distribution.accessURL}
                                    />
                                }
                            />
                        </Tabs>
                    </Col>
                </Row>
            </Collapse>
        </Card>
    );
}

function GetDataDirectDownload() {
    return null;
}

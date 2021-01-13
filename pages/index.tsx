import { FixedContainer, HtmlHead } from "@ecocommons-australia/ui-library";
import { Col, Row } from "react-grid-system";
import DatasetCard from "../components/DatasetCard";

import Header from "../components/Header";
import { DatasetType } from "../interfaces/DatasetType";

const subBarLinks = [
    { key: "explore", href: "/data", label: "Explore data" },
    {
        key: "my-data",
        href: "https://example.com/data/my-data",
        label: "My data and results",
    },
    {
        key: "import",
        href: "https://example.com/data/import",
        label: "Import data",
    },
];

const sampleDatasets = [
    {
        id: "123",
        title: "Dataset 123",
        description: "Vivamus eget nisl ac nisi fermentum faucibus. Nullam ullamcorper enim et ex fringilla interdum. Quisque at orci iaculis, vehicula ex ut, convallis lorem. Suspendisse potenti. Morbi efficitur ut lacus quis consectetur. Duis dignissim scelerisque urna, at tempor est dignissim eu. Maecenas euismod tincidunt mauris, mattis bibendum turpis suscipit nec. Mauris semper enim a risus auctor tristique nec elementum nisl. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse lobortis orci vel sem tempor dictum. Integer et lacus nulla. Vestibulum feugiat, augue sed fringilla vehicula, purus nulla semper dui, vitae gravida leo ipsum ac turpis. Donec nec dolor egestas, tincidunt metus id, condimentum dolor. Nunc gravida diam sapien, at tincidunt lorem hendrerit iaculis. Nunc quis tempus purus, in malesuada sem. Ut dignissim tincidunt neque, quis iaculis orci scelerisque eu.",
        type: {
            type: "biological",
            subtype: "occurrence",
        } as DatasetType,
        lastUpdated: new Date("2020-12-01"),
    },
    {
        id: "456",
        title: "Dataset 456",
        description: "This is a dataset 456\n2nd line\nLorem ipsum dolor sit amet, consectetur adipiscing elit. In efficitur interdum libero sit amet ultricies. Etiam rhoncus odio id condimentum sollicitudin. Maecenas lacus nisl, interdum et libero quis, pretium imperdiet risus. Ut pharetra dui sed orci accumsan, at congue leo condimentum. Etiam gravida in lectus sed egestas. Fusce finibus rhoncus arcu at dignissim. Pellentesque nec nisi nulla. Nulla scelerisque interdum dignissim.",
        lastUpdated: new Date("2020-10-11"),
    },
];

export default function IndexPage() {
    return (
        <>
            <HtmlHead title={["Data and Visualisations", "Explore data"]} />
            <Header
                activeTab="data"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
            <FixedContainer>
                <Row style={{ marginTop: "1rem" }}>
                    <Col>
                        {sampleDatasets.map(
                            ({ id, title, description, type, lastUpdated }) => (
                                <DatasetCard
                                    key={id}
                                    title={title}
                                    description={description}
                                    type={type}
                                    lastUpdated={lastUpdated}
                                />
                            )
                        )}
                    </Col>
                </Row>
            </FixedContainer>
        </>
    );
}

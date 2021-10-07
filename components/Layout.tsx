import {
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";
import Link from 'next/link'
import Header from "../components/Header";
import {
    getDataExplorerSubbarImportData
} from "../util/env";

//TO do: type for {children}

const Layout = ({ children }) => {

    const subBarLinks = [
        { key: "explore", href: "/", label: "Explore data" },
        {
            key: "import",
            href: getDataExplorerSubbarImportData() || "#",
            label: "Import data",
        },
    ];

    return (
        <>
            <HtmlHead title={["Datasets", "Explore data"]} />
            <Header
                activeTab="datasets"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
             <Row>
                <Col xs={2}>EcoCommons</Col>
                <Col xs={2}>
                    <Link href="/knowledge">Knowledge Network</Link>
                </Col>
             </Row>
            { children }
        </>
        
    );
}

export default Layout;
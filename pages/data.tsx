import Header from "../components/Header";
import HtmlHead from "../components/HtmlHead";

const subBarLinks = [
    { key: "explore", href: "/data", label: "Explore data" },
    { key: "my-data", href: "/data/my-data", label: "My data and results" },
    { key: "import", href: "/data/import", label: "Import data" },
];

export default function Data() {
    return (
        <>
            <HtmlHead title={["Data and Visualisations", "Explore data"]} />
            <Header
                tab="data"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
        </>
    );
}

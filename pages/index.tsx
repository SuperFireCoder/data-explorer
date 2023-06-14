import { FormEvent, useCallback, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import bodybuilder, { Bodybuilder } from "bodybuilder";
import { InputGroup, Button, H6, Switch, FocusStyleManager, Spinner } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";
import {getDataExplorerSubbarImportData,} from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import {
    FixedContainer,
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";
import getConfig from "next/config";
import ExploreEcoData from "../components/ExploreEcoData";
import ExploreKnowledgeData from "../components/ExploreKnowledgeData";
import PinnedData from "../components/ExplorePinnedData"
import Header from "../components/Header";
const config = getConfig();

const subBarLinks = [
    {key: "eco-data",
      href: "/?tab=eco-data", 
      label: "Explore EcoCommons Data",
    },
    {
      key: "knowledge-data",
      href: "/?tab=knowledge-data",
      label: "Explore Knowledge Network Data",
    },
    // {
    //     key: "pinned-data",
    //     href: "/?tab=pinned-data",
    //     label: "Pinned Data",
    //   },
    {
      key: "import",
      href: getDataExplorerSubbarImportData() || "#",
      label: "Import data",
      align: "right"
    },
  ];

export default function IndexPage() {
    /** Hide the blue outline when mouse down. Only show the switch's blue outline for accessibility when users using keyboard tab. */
    FocusStyleManager.onlyShowFocusOnTabs();

    const { keycloak } = useKeycloakInfo();
    const router = useRouter();
    const keycloakToken = keycloak?.token;
    const isEmbed = router.query.embed === "1";
    //let initialTab = router.query.tab as string | undefined;
    let initialTab = "eco-data";

    const [currentTab, setCurrentTab] = useState("eco-data")
    const [subBarActiveKey, setSubBarActiveKey] = useState("eco-data");
  
    useEffect(() => {
       if(router.asPath === "/") {
        router.replace("/?tab=eco-data", undefined, { shallow: true })
       }
    }, [router.asPath])

    /** 
     * Set the current tab based on 'router.query.tab'
     */
    useEffect(() => {
        const tab = router.query.tab;
        // set the tab
        setCurrentTab(tab as string || initialTab); 
        //set the active sub bar link 
        setSubBarActiveKey(tab as string || initialTab)
        if(router.query.tab === undefined && router.asPath === `${config.publicRuntimeConfig
            .NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_DATASETS}/`){
                router.push("/?tab=eco-data", undefined, { shallow: true })
        }
    }, [router.query]);

    const renderTab = () => {
        switch (currentTab) {
            case "eco-data":
                return <ExploreEcoData />;
            case "knowledge-data":
                return <ExploreKnowledgeData />;
            // case "pinned-data":
            //     return <PinnedData />;
            default:
                return null;
        }
    }

    if (isEmbed === true){
        return (
            <>
                <HtmlHead title={["Datasets", "Explore data"]} />
                <ExploreEcoData />
            </>
        );
    }

    if (keycloak?.authenticated === undefined) {
        return (
            <div  style={{ 'padding': 200 }}>
                <Spinner/>
            </div>
        );
    }

    return (
        <>
        <HtmlHead title={["Datasets", "Explore data"]} />
        <Header
                activeTab="datasets"
                subBarLinks={subBarLinks}
                subBarActiveKey={subBarActiveKey}
            />
            <FixedContainer style={{ padding: "1rem" }}>
            {renderTab()}
            </FixedContainer>
        </>
    );
}

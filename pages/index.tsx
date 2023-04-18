import {FormEvent,useCallback,useEffect,useState,} from "react";
import { useRouter } from "next/router";
import bodybuilder, { Bodybuilder } from "bodybuilder";
import { InputGroup, Button, H6, Switch, FocusStyleManager } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";
import {getDataExplorerSubbarImportData,} from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import {
    FixedContainer,
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";

import ExploreEcoData from "../components/ExploreEcoData";
import ExploreKnowledgeData from "../components/ExploreKnowledgeData";
import PinnedData from "../components/ExplorePinnedData"
import Header from "../components/Header";

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
    {
        key: "pinned-data",
        href: "/?tab=pinned-data",
        label: "Pinned Data",
      },
    {
      key: "import",
      href: getDataExplorerSubbarImportData() || "#",
      label: "Import data",
    },
  ];


interface QueryParameters {
    pageSize?: string;
    pageStart?: string;
    searchQuery?: string;
    filterPrincipals?: string | string[];

    facetYearMin?: string;
    facetYearMax?: string;
    facetTimeDomain?: string | string[];
    facetSpatialDomain?: string | string[];
    facetResolution?: string | string[];
    facetGcm?: string | string[];
    facetDomain?: string | string[];
    facetScientificType?: string | string[];
}

function stripEmptyStringQueryParams(
    queryParams: ParsedUrlQueryInput
): ParsedUrlQueryInput {
    return Object.fromEntries(
        Object.entries(queryParams).filter(
            ([_k, v]) => typeof v !== "string" || v.length !== 0
        )
    );
}

function normaliseAsReadonlyStringArray(
    value: string | readonly string[]
): readonly string[] {
    return typeof value === "string" ? [value] : value;
}


function addTermAggregationFacetStateToQuery(
    queryBuilder: Bodybuilder,
    isEmptyQuery: boolean,
    facetEsTerm: string,
    facetValues: readonly string[]
): [Bodybuilder, boolean] {
    // If nothing selected for this facet, return state untouched
    if (facetValues.length === 0) {
        return [queryBuilder, isEmptyQuery];
    }

    // Add all selected facet values
    let innerQuery = bodybuilder();

    facetValues.forEach(
        (x) => (innerQuery = innerQuery.orQuery("match", facetEsTerm, x))
    );

    const newQueryBuilder = queryBuilder.query(
        "bool",
        (innerQuery.build() as any).query.bool
    );

    return [newQueryBuilder, false];
}

function suppressEvent(e: Event | FormEvent | MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
}

export default function IndexPage() {
    /** Hide the blue outline when mouse down. Only show the switch's blue outline for accessibility when users using keyboard tab. */
    FocusStyleManager.onlyShowFocusOnTabs();

    const { keycloak } = useKeycloakInfo();
    const router = useRouter();
    const isEmbed = router.query.embed === "1";
    const keycloakToken = keycloak?.token;
    //let initialTab = router.query.tab as string | undefined;
    let initialTab = "eco-data";

    const [currentTab, setCurrentTab] = useState("eco-data")

    const [subBarActiveKey, setSubBarActiveKey] = useState("eco-data");
  
    useEffect(() => {
       if(router.asPath === "/") {
        router.push("/?tab=eco-data", undefined, { shallow: true })
       }
    }, [router.asPath])


    useEffect(() => {
        const tab = router.query.tab;
        setCurrentTab(tab as string || initialTab);
        setSubBarActiveKey(tab as string || initialTab)
    }, [router.query]);



    useEffect(() => {    
    }, []);


    const updateTabQueryParam = useCallback( 
        (newTabId: string) => {
            router.replace({
                query: { ...router.query, tab: newTabId },
            });
        },
        [router]
    );

    const renderTab = () => {
        switch (currentTab) {
            case "eco-data":
                return <ExploreEcoData />;
            case "knowledge-data":
                return <ExploreKnowledgeData />;
            case "pinned-data":
                return <PinnedData />;
            default:
                return null;
        }
    }

    // const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    //     event.preventDefault();
    //     setCurrentTab(key);
    //     updateTabQueryParam(key);
    // }


    // const renderSubBarLink = (link: { key: string; href: string; label: string; }) => {
    //     const isActive = currentTab === link.key;

    //     return (
    //         <a
    //             key={link.key}
    //             href={link.href}
    //             className={`env-subbar-link ${isActive ? "active" : ""}`}
    //             onClick={(event) => handleClick(event, link.key)}
    //         >
    //             {link.label}
    //         </a>
    //     );
    // }

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

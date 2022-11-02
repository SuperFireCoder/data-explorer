import { Tabs, Tab, Popover, Icon, Position, PopoverInteractionKind } from "@blueprintjs/core";
import {
    FixedContainer,
    HtmlHead,
    Col,
    Row,
} from "@ecocommons-australia/ui-library";
import {
    ChangeEventHandler,
    FormEvent,
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { SearchResponse } from "elasticsearch";
import { useRouter } from "next/router";
import bodybuilder, { Bodybuilder } from "bodybuilder";
import axios from "axios";
import { InputGroup, Button, H6, Switch, FocusStyleManager } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";

import Header from "../components/Header";
import DatasetCard from "../components/DatasetCard";
import Pagination from "../components/Pagination";
import FacetMultiSelectFacetState from "../components/FacetMultiSelectFacetState";
import { EsDataset } from "../interfaces/EsDataset";
import { DatasetType } from "../interfaces/DatasetType";
import { useFacetState } from "../hooks/FacetState";
import {
    getDataExplorerBackendServerUrl,
    getDataExplorerSubbarImportData,
} from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import { Select } from "@blueprintjs/select";
import ExploreEcoData from "../components/ExploreEcoData";
import ExploreKnowledgeData from "../components/ExploreKnowledgeData";
import styles from "../components/FacetSelectFacetState2.module.css"


const renderTabLabel = (id: string) => {
    return <>{id === "eco-data" ? "Explore EcoCommons Data" : "Explore Knowledge Network Data"}&nbsp;
        <Popover position={Position.TOP_LEFT}
            autoFocus={false}
            interactionKind={PopoverInteractionKind.HOVER}
            content={<span className={styles.toolTip}>
                {id === "eco-data" 
                ? "Data ready for use in modelling wizards." 
                : "Find data with a description and download it from CSIRO’s catalogue."}
            </span>}>
            <a><Icon icon="info-sign" iconSize={15} /></a>
        </Popover>
    </>;
}

const subBarLinks = [
    { key: "explore", href: "/", label: "Explore data" },
    {
        key: "import",
        href: getDataExplorerSubbarImportData() || "#",
        label: "Import data",
    },
];

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;

    /** Array of users/subjects to filter results by */
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
    // Create a new object from page params such that empty string values are
    // dropped
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

/**
 * Adds term aggregation based facets to given bodybuilder query instance, and
 * a carrying boolean flag that indicates whether the query is "empty" (that is,
 * whether the query has had filters applied such as prior facets or some string
 * query.)
 *
 * @param queryBuilder
 * @param isEmptyQuery
 * @param facetEsTerm String identifier for the term used in Elasticsearch query
 * @param facetValues
 *
 * @returns Array of [new bodyBuilder query instance, `isEmptyQuery` boolean]
 */
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

    let initialTab = router.query.tab as string | undefined;
    
    const [currentTab, setCurrentTab] = useState("eco-tab")
    // console.log(router)

    //TO REVIEW: 
    useEffect(() => {
       if(router.asPath === "/") {
        router.push("/?tab=eco-data", undefined, { shallow: true })
       }
    }, [router.asPath])


    useEffect(() => {
        const tab = router.query.tab;

        // TODO: Look up/validate the tab name

        // Set the tab
        setCurrentTab(tab as string);
    }, [router.query]);

    useEffect(() => {
        // Set default tab
        
    }, []);

    // console.log('init router', router)
    /** Updates URL in browser with current tab without affecting history */
    const updateTabQueryParam = useCallback(
        
        (newTabId: string) => {
            // console.log({newTabId, ...router.query})
            router.replace({
                query: { ...router.query, tab: newTabId },
            });
        },
        [router]
    );

    const tabs = useMemo(() => {

        // Embed mode only currently supports selection of EcoData
        if (isEmbed){
             return (<ExploreEcoData />);
        }

        return (
                <Tabs
                        animate
                        renderActiveTabPanelOnly
                        defaultSelectedTabId={initialTab}
                        onChange={updateTabQueryParam}
                    >
                        <Tab
                            id="eco-data"
                            title={renderTabLabel("eco-data")}
                            data-cy="explore-eco-data"
                            panel={<ExploreEcoData />}
                        />
                        <Tab
                            id="knowledge-data"
                            title={renderTabLabel("knowledge-data")}
                            panel={<ExploreKnowledgeData />}
                        />
                </Tabs>
            );
    }, []);

    if (isEmbed === true){
        return (
            <>
                <HtmlHead title={["Datasets", "Explore data"]} />
                {tabs}
            </>
        );
    }
       
    return (
        <>
            <HtmlHead title={["Datasets", "Explore data"]} />
            <Header
                activeTab="datasets"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
            <FixedContainer style={{ padding: "1rem" }}>
                {tabs}
            </FixedContainer>
        </>
    );
}

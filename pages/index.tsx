import { Tabs, Tab } from "@blueprintjs/core";
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

    const keycloakToken = keycloak?.token;

    const initialTab = router.query.tab as string | undefined;
    console.log(keycloak, keycloakToken)
    /** Updates URL in browser with current tab without affecting history */
    const updateTabQueryParam = useCallback(
        
        (newTabId: string) => {
            console.log({newTabId, ...router.query})
            router.replace({
                query: { ...router.query, tab: newTabId },
            });
        },
        [router]
    );

    return (
        <>
            <HtmlHead title={["Datasets", "Explore data"]} />
            <Header
                activeTab="datasets"
                subBarLinks={subBarLinks}
                subBarActiveKey="explore"
            />
            <FixedContainer style={{ padding: "1rem" }}>
                <Tabs
                        animate
                        renderActiveTabPanelOnly
                        defaultSelectedTabId={initialTab}
                        onChange={updateTabQueryParam}
                    >
                        <Tab
                            id="eco-data"
                            title="Explore EcoCommons Data"
                            panel={<ExploreEcoData />}
                        />
                        <Tab
                            id="knowledge-data"
                            title="Explore Knowledge Network Data"
                            panel={<ExploreKnowledgeData />}
                        />
                </Tabs>
            </FixedContainer>
        </>
    );
}

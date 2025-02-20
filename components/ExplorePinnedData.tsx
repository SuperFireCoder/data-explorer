import { Col, Row } from "@ecocommons-australia/ui-library";
import React, { FormEvent, useCallback, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import bodybuilder from "bodybuilder";
import { Button, H6, Spinner, SpinnerSize, Icon, Tooltip, Classes } from "@blueprintjs/core";
import { ParsedUrlQueryInput } from "querystring";
import DatasetCard from "./DatasetCard";
import Pagination from "./Pagination";
import { DatasetType } from "../interfaces/DatasetType";
import { useEffectTrigger } from "../hooks/EffectTrigger";

import { getDataExplorerBackendServerUrl } from "../util/env";
import { useKeycloakInfo } from "../util/keycloak";
import {
    EsFacetRootConfig,
    QueryState,
    useEsFacetRoot,
    useEsIndividualFacetFreeText,
} from "../hooks/EsFacet";
import FacetFreeTextFacetState2 from "./FacetFreeTextFacetState2";
import { usePinnedDataStore } from "./../hooks/PinnedDataStore";
import { useDataManager } from "../hooks/DataManager";
import { PinnedDataset } from "./../interfaces/PinnedDataset";

interface QueryParameters {
    /** Results per page */
    pageSize?: string;
    /** Start result index of page */
    pageStart?: string;
    /** Search query string */
    searchQuery?: string;
}

interface FormState {
    pageSize: number;
    pageStart: number;
    searchQuery: string;
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

const FACETS: EsFacetRootConfig<FormState>["facets"] = [
    {
        id: "searchQuery",
        facetApplicationFn: (formState, query) => {
            const searchQuery = formState.searchQuery.trim();

            // If blank, don't apply this facet
            if (searchQuery.length === 0) {
                return query;
            }

            // The search box value is used for a query against title
            // and description
            const innerQuery = bodybuilder()
                .orQuery("match", "title", searchQuery)
                .orQuery("match", "description", searchQuery)
                .orQuery("wildcard", "title", `*${searchQuery}*`)
                .orQuery("wildcard", "description", `*${searchQuery}*`)
                .rawOption("track_total_hits", true);

            return {
                modified: true,
                bodyBuilder: query.bodyBuilder.query(
                    "bool",
                    (innerQuery.build() as any).query.bool
                ),
            };
        },
    }
];

export default function IndexPage() {

    const { dataManager, userSessionActive } = useDataManager();

    const dataStore = usePinnedDataStore.getState();

    const [isPinnedDataLoaded, setIsPinnedDataLoaded] = useState(false);

    dataStore.setIsPinnedPage(true)

    const router = useRouter();

    const [datasetUUIDToDelete, setDatasetUUIDToDelete] =
        useState<string | undefined>(undefined);
    const [datasetUUIDToUnshare, setDatasetUUIDToUnshare] =
        useState<string | undefined>(undefined);
        
        
    const {
        triggerValue: searchTriggerValue,
        triggerEffect: triggerSearch,
    } = useEffectTrigger();

    useEffect(() => {
        if (userSessionActive === undefined){
            return
        }
        const { promise: pinnedDataResponsePromise } = dataManager.getPinnedDataset();
        pinnedDataResponsePromise.then((pinnedDataResponse: any) => {
            dataStore.setPinnedDatasets(pinnedDataResponse) 
            dataStore.setFilteredPinnedDataset(pinnedDataResponse)
            setIsPinnedDataLoaded(true)
            if (!dataStore.isPageRefreshed){
                window.location.reload();
                dataStore.setIsPageRefreshed(true)
            }
        })
    }, [dataManager, userSessionActive, isPinnedDataLoaded, setIsPinnedDataLoaded]);

    const updateFormState = useCallback(
        (formState: Partial<FormState>) => {
            // Copy out state and replace NaN values with empty strings
            //
            // This means that those keys with NaN values are removed from the
            // query params when it gets passed through
            // `stripEmptyStringQueryParams()` below
            const state = { ...formState };

            for (const key of Object.keys(state) as (keyof typeof state)[]) {
                if (Number.isNaN(state[key])) {
                    // Deliberately set the value as empty string
                    state[key] = "" as any;
                }
            }

            // Update query params for this page, which will update `formState`
            // above
            router.push({
                query: stripEmptyStringQueryParams({
                    ...router.query,
                    ...state,
                }),
            });
        },
        [router.query]
    );

    /**
     * Extracts the current page parameters from the URL query parameter values.
     */
    const formState = useMemo<FormState>(() => {
        const {
            pageSize = "10",
            pageStart = "0",
            searchQuery = "",
        } = router.query as QueryParameters;

        return {
            // Pagination
            pageSize: parseInt(pageSize, 10) || 10,
            pageStart: parseInt(pageStart, 10) || 0,

            // String search query
            searchQuery
        };
    }, [router.query,searchTriggerValue]);

    const getProcessedQueryResult = (): PinnedDataset [] => {
        //Removes dataset from dataset list if user deleted it or unshared it.
        if ((datasetUUIDToDelete || datasetUUIDToUnshare) && dataStore.pinnedDatasets) {
            const indexToDelete = dataStore.pinnedDatasets.findIndex(x => x.uuid == (datasetUUIDToDelete || datasetUUIDToUnshare))
            setDatasetUUIDToDelete(undefined)
            setDatasetUUIDToUnshare(undefined)
            if (indexToDelete !== -1) // if matching uuid is found, return spliced dataset list
            {
                return dataStore.pinnedDatasets.splice(indexToDelete, 1)
            }
            else {
                return fetchDataFromDataStore(formState)
            }
        }
        else {
            return fetchDataFromDataStore(formState)
        }

    }

    const fetchDataFromDataStore = (formState: Partial<FormState>) => {
       if (formState.pageSize && formState.pageStart !== undefined && formState.searchQuery !== undefined){
        const filteredList : PinnedDataset[] = []

        for (const item of dataStore.pinnedDatasets) {
        if (item.title.toLowerCase().includes(formState.searchQuery.toLowerCase())) {
            filteredList.push(item);
        }
        dataStore.setFilteredPinnedDataset(filteredList)
        }
        const modifiedList = filteredList.slice(formState.pageStart, formState.pageStart + formState.pageSize)
        return modifiedList
       }
       
       return dataStore.pinnedDatasets
    };
      
    const esFacetRoot = useEsFacetRoot(formState, updateFormState, {
        facets: FACETS,
        url: `${getDataExplorerBackendServerUrl()}/api/es/search/dataset`,
    });

    const { totalNumberOfResults, queryInProgress, queryResult } = esFacetRoot;

    const numberOfAllResults =  dataStore.filteredPinnedDataset.length

    const searchQuery = useEsIndividualFacetFreeText(esFacetRoot, {
        id: "searchQuery",
        label: "Search",
        placeholder: "Search datasets...",
    });

    const { keycloak } = useKeycloakInfo();


    const currentPageIndex = useMemo(
        () => Math.floor(formState.pageStart / formState.pageSize),
        [formState.pageStart, formState.pageSize]
    );

    const maxPages = useMemo(
        () => Math.ceil(numberOfAllResults / formState.pageSize),
        [numberOfAllResults, formState.pageSize]
    );

    /**
     * Handler to change page query parameter values via URL query parameters.
     */
    const onPageSelect = useCallback(
        (pageIndex: number) => {
            updateFormState({
                pageSize: formState.pageSize,
                pageStart: pageIndex * formState.pageSize,
            });
        },
        [updateFormState, formState.pageSize]
    );

    return (
        <Row data-cy="ExplorePinnedDataTab">
            <Col xs={2}>
                <Row disableDefaultMargins>
                    <Col>
                        <FacetFreeTextFacetState2
                            facet={searchQuery}
                            data-testid="search-field"
                            data-cy="search-field"
                            type="search"
                            leftIcon="search"
                            rightElement={
                                searchQuery.value.length > 0 ? (
                                    <Button
                                        icon="small-cross"
                                        minimal
                                        onClick={() =>
                                            searchQuery.onValueChange("")
                                        }
                                        style={{
                                            borderRadius: "100%",
                                        }}
                                    />
                                ) : undefined
                            }
                            id="dataset-search"
                        />
                    </Col>
                </Row>
            </Col>
            <Col xs={10}>
                <Row disableDefaultMargins align="center">
                    <Col
                        xs="content"
                        className="bp5-ui-text bp5-text-disabled"
                        data-testid="results-count"
                    >
                        {queryInProgress ? (
                            <Spinner size={SpinnerSize.SMALL} />
                        ) : (
                            <>
                                {numberOfAllResults} result
                                {numberOfAllResults !== 1 && "s"}
                            </>
                        )}
                    </Col>
                    <Col xs={6}>
                    </Col>
                    <Col
                        style={{ textAlign: "right" }}
                        data-testid="pagination-buttons"
                    >
                        <Pagination
                            currentIndex={currentPageIndex}
                            max={maxPages}
                            onSelect={onPageSelect}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {getProcessedQueryResult()?.map((item) => (
                            <DatasetCard
                                data-cy="dataset-card"
                                data-testid="dataset-card"
                                key={item.id}
                                datasetId={item.uuid}
                                title={item.title}
                                description={item.description}
                                status={item.status}
                                downloadable={true}
                                message={item.message}
                                type={
                                    item.status === "SUCCESS"
                                        ?
                                        (item.scientific_type)
                                        : undefined
                                }
                                ownerId={[item.owner]}
                                setDatasetUUIDToDelete={setDatasetUUIDToDelete}
                                setDatasetUUIDToUnshare={setDatasetUUIDToUnshare}
                                // acl={_source.acl}
                                // Not yet enabled as pinned DS uses a different data model to the main view 
                                // Users will get a 403 until this is sorted.
                            />
                        ))}
                    </Col>
                </Row>
                <Row>
                    <Col style={{ textAlign: "right" }}>
                        <Pagination
                            currentIndex={currentPageIndex}
                            max={maxPages}
                            onSelect={onPageSelect}
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}


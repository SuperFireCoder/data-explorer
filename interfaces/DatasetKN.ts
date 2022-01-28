export interface DataDatasetStrings {
    contactPoint?: string;
    description?: string;
    keywords?: string[];
    langauage?: string[];
    modified?: string;
    publisher?: string;
    spatial?: string;
    temporal?: {
        end?: string;
        start?: string;
    }
    themes?: string[];
    title?: string;
}

export interface OrganizationDetails {
    addrCountry?: string;
    addrPostCode?: string;
    addrState?: string;
    addrStreet?: string;
    addrSuburb?: string;
    email?: string;
    name?: string;
    phone?: string;
    title?: string;
}

export interface DataDatasetPublisher {
    publisher: {
        aspects: {
            "organization-details"?: OrganizationDetails;
            source?: {
                id?: string;
                name?: string;
                type?: string;
                url?: string;
            }
        }
    }
}

export interface DataSourceKN {
    id?: string;
    name?: string;
    type?: string;
    url?: string;
}

export interface Aspects {
    "dcat-dataset-strings"?: DataDatasetStrings;
    "dataset-publisher"?: DataDatasetPublisher;
    source?: DataSourceKN;
}

export interface DatasetKN {
    aspects: Aspects;
    id?: string;
    name?: string;
    sourceTag?: string;
    tenantId?: number;
}

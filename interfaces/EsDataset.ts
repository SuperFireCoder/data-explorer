/** Dataset object, as found in Elasticsearch index/search responses */
export interface EsDataset {
    acl: unknown[];
    allowed_principals: unknown[];
    allowed_principals_label: unknown[];
    citation: unknown;
    data_category: string[];
    domain: string;
    description: string;
    downloadable: boolean;
    emsc: unknown;
    external_url: string;
    gcm: unknown;
    genre: string;
    license: string;
    message: string;
    mimetype: string;
    month: string;
    pinned: string[];
    realm: string;
    resolution: string;
    scientific_type: string[];
    spatial_data_type: string;
    spatial_domain: string;
    status: "SUCCESS" | "IMPORTING" | "FAILED" | "CREATED";
    time_domain: string;
    title: string;
    type: string;
    uuid: string;
    variables: string[];
    year: unknown;
}
/** Dataset object, as found in Elasticsearch index/search responses */
export interface EsDataset {
    variables: readonly string[];
    citation: unknown;
    year: unknown;
    allowed_principals: readonly unknown[];
    time_domain: string;
    description: string;
    spatial_domain: string;
    type: string;
    title: string;
    message: string;
    resolution: string;
    gcm: unknown;
    external_url: string;
    domain: string;
    emsc: unknown;
    scientific_type: readonly string[];
    status: string;
}

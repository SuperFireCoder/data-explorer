export interface EsDataset {
    _index: "dataset";
    _type: "_doc";
    _id: string;
    _score: number;
    _source: {
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
    };
}

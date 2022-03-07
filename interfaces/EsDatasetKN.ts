/** Dataset object, as found in Elasticsearch index/search responses */
export interface EsDatasetKN {
    accessControl: unknown;
    accessNotes: unknown;
    accrualPeriodicity: {
        text: string;
    };
    accrualPeriodicityRecurrenceRule: unknown;
    catalog: string;
    contactPoint: {
        identifier: string;
    };
    description: string;
    distributions?: Distribution[];
    hasQuality: boolean;
    identifier: string;
    indexed: string;
    issued: string;
    keywords: string[];
    landingPage?: string | null;
    language: string[];
    modified: string;
    provenance: unknown;
    publisher: string;
    publishingState: string;
    quality: number;
    score: unknown;
    source: {
        id: string;
        name: string;
        url: string;
    };
    spatial: {
        geoJson: {
            coordinates: number[][];
            type: string;
        };
        text: string;
    };
    temporal: {
        end: {
            date: string;
            text: string;
        };
        start: {
            date: string;
            text: string;
        };
    };
    tenantId: number;
    themes: string[];
    title: string;
    year: string;
}

export interface DataStatusKN {
    status: "SUCCESS" | "FAILED";
    message: string;
}

export interface Distribution {
    accessURL?: string;
    description: string;
    downloadURL?: string;
    format?: string;
    identifier: string;
    /** Date string */
    issued?: string;
    mediaType: string;
    source?: {
        id: string;
        name: string;
        url: string;
    };
    title: string;
}

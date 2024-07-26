export interface X {
    num: number;
    stop: number;
    start: number;
}

export interface Axes {
    x?: X;
    y?: X;
}

export interface System {
    type: string;
    wkt: string;
}

export enum Coordinate {
    X = "x",
    Y = "y",
}

export interface Referencing {
    coordinates?: Coordinate[];
    type?: string;
    columns?: string[];
    system: System;
}

export interface Domain {
    type: string;
    domainType: string;
    axes: Axes;
    referencing: Referencing[];
}

export interface Label {
    en: string;
}

export interface DmgrStatistics {
    max: number;
    min: number;
    mean: number;
    stddev: number;
}

export interface Unit {
    symbol: Symbol;
}

export interface Symbol {
    value: Value;
}

export interface Value {
    type: string;
    value: string | ValueValue;
}

export interface ValueValue {
    symbol: ValueSymbol;
}

export interface ValueSymbol {
    type: string;
    value: string;
}

export interface Category {
    id: string;
    label: Label;
}

export interface ObservedProperty {
    id: string;
    label: Label;
    categories?: Category[];
    "dmgr:nodata"?: number;
    "dmgr:statistics"?: DmgrStatistics;
    "dmgr:legend"?: string;
}

export interface ParameterData {
    type: string;
    observedProperty: ObservedProperty;
    unit?: Unit;
    categoryEncoding?: { [key: string]: number };
}

export interface Parameters {
    [parameter: string]: ParameterData;
}

export interface Ranges {}

export interface ExtentWgs84 {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export interface BccvlMetadata {
    url?: string;
    uuid: string;
    count?: number;
    genre?: string;
    title: string;
    domain?: string | null;
    auxfiles?: unknown;
    mimetype?: string;
    categories: string[];
    source_url?: unknown;
    description?: string;
    attributions?: Attribution[];
    extent_wgs84: ExtentWgs84;
    scientificName?: string[];
    year?: number | string;
    month?: number;
    partof?: string[];
    license?: string;
    resolution?: string;
    year_range?: number[];
    time_domain?: string;
    external_url?: string;
    spatial_domain?: string;
    acknowledgement?: string | null;
    doi?: string;
    citation?: string;
    provider?: string;
    landingpage?: string;
    "citation-url"?: string;
    description_full?: string;
    rights?: string;
}

export interface Attribution {
    type: string;
    value: string;
}

export interface DmgrCsv {
    url: string;
    tempurl: string;
}

export interface RangeAlternates {
    "dmgr:csv"?: DmgrCsv;
    "dmgr:tiff"?: DmgrTiff;
    "dmgr:shp"?: DmgrShp;
}

export interface DmgrTiff {
    [layer: string]: DmgrTiffLayerData;
}

export interface DmgrShp {
    [layer: string]: DmgrShpLayerData;
}

export interface DmgrTiffLayerData {
    type: string;
    datatype: string;
    axisNames: string[] | Coordinate[];
    shape: number[];
    "dmgr:datatype": string;
    url: string;
    tempurl: string;
}

export interface DmgrShpLayerData {
    type: string;
    datatype: string;
    "dmgr:datatype": string;
    url: string;
    tempurl: string;
}

export interface Dataset {
    type: string;
    domain: Domain;
    parameters: Parameters;
    ranges: Ranges;
    "bccvl:metadata": BccvlMetadata;
    rangeAlternates: RangeAlternates;
}

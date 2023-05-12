export type DatasetType =
    DatasetTypeBiological
    | DatasetTypeEnvironmental
    | DatasetTypeFile
    | DatasetFailed

interface DatasetTypeBiological {
    type: "biological";
    subtype: "occurrence" | "multi-species" | "absence" | "traits";
}

interface DatasetTypeEnvironmental {
    type: "environmental";
    subtype:
        | "climate"
        | "topography"
        | "hydrology"
        | "substrate"
        | "vegetation"
        | "land-cover"
        | "land-use"
        | "net-primary-productivity"
        | "physical"
        | "nutrients"
        | "biochemical";
}

interface DatasetTypeFile {
    type: "others"
    // may have more subtypes for `others` later
    subtype: 
        | "spatialShape"
        | "file";
}

interface DatasetFailed {
    type: "failed"
    // may have more subtypes for `others` later
    subtype: 
        | "Import Failed";
}

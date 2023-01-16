export type DatasetType =
    DatasetTypeBiological
    | DatasetTypeEnvironmental
    | DatasetTypeFile

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
    type: "file"
    // Subtype is the mimetype for File
    subtype: string;
}
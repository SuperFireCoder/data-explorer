export type DatasetType =
    DatasetTypeBiological
    | DatasetTypeEnvironmental
    | DatasetTypeFile
    // Todo: need to clear DatasetTypeFile_Broken once backend & database for data type dataset fixed
    | DatasetTypeFile_Broken;

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
    // Todo: need to add subtype
}

interface DatasetTypeFile_Broken {
    type: "f"
}

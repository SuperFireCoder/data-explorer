export type DatasetType = DatasetTypeBiological | DatasetTypeEnvironmental;

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

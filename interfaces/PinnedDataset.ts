enum DataStatus {
  SUCCESS = "SUCCESS",
  IMPORTING = "IMPORTING",
  FAILED = "FAILED",
  CREATED = "CREATED",
}
export interface PinnedDataset {
    id: number;
    uuid: string;
    title: string;
    description: string;
    scientific_type: string[];
    owner: string;
    status: DataStatus;
    message: string;
    created: string;
}
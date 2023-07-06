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
    categories: string[];
    owner: string;
    acl: object;
    status: DataStatus;
    message: string;
    created: string;
    ES_index_enabled: Boolean;
    collection: null;
    data: string[];
  }
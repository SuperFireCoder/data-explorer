enum DataStatus {
  SUCCESS = "SUCCESS",
  IMPORTING = "IMPORTING",
  FAILED = "FAILED",
  CREATED = "CREATED",
}
export interface Attributes {
    uuid: string;
    year: number;
    title: string;
    domain: string;
    partof: string[];
    license: null | any;
    categories: string[];
    resolution: string;
    year_range: [number, number];
    time_domain: string;
    extent_wgs84: {
      top: number;
      left: number;
      right: number;
      bottom: number;
    };
    external_url: null | any;
    spatial_domain: string;
    acknowledgement: null | any;
};

export interface PinnedDataset {
    id: number;
    uuid: string;
    title: string;
    description: string;
    attributes: Attributes;
    owner: string;
    acl: object;
    status: DataStatus;
    message: string;
    created: string;
    ES_index_enabled: Boolean;
    collection: null;
    data: string[];
  }
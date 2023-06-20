import { create, createStore } from 'zustand';
import { useDataManager } from "../hooks/DataManager";
import { persist, createJSONStorage,devtools } from 'zustand/middleware'
import { Dataset } from "./../interfaces/PinnedDataset"

// export interface Dataset {
//   id: number;
//   uuid: string;
//   title: string;
//   description: string;
//   attributes: {
//     uuid: string;
//     year: number;
//     title: string;
//     domain: string;
//     partof: string[];
//     license: null | any;
//     categories: string[];
//     resolution: string;
//     year_range: [number, number];
//     time_domain: string;
//     extent_wgs84: {
//       top: number;
//       left: number;
//       right: number;
//       bottom: number;
//     };
//     external_url: null | any;
//     spatial_domain: string;
//     acknowledgement: null | any;
//   };
//   owner: string;
//   acl: object;
//   status: "SUCCESS" | "IMPORTING" | "FAILED" | "CREATED";
//   message: string;
//   created: string;
//   ES_index_enabled: Boolean;
//   collection: null;
//   data: string[];
// }

interface DataStore {
  pinnedDatasets: Dataset[];
  isDatasetPinned: (datasetId: string) => boolean;
  setPinnedDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
  filteredPinnedDataset: Dataset[];
  setFilteredPinnedDataset: (datasets: Dataset[]) => void;
  addFilteredPinnedDataset: (dataset: Dataset) => void;
  removeFilteredPinnedDataset: (datasetId: string) => void;
  isPageRefreshed: boolean
  setIsPageRefreshed: (status: boolean) => void;
}


export const useDataStore = create<DataStore>()(devtools((
  persist(
    (set, get) => ({
    pinnedDatasets: [],
    isDatasetPinned: (datasetId) => {
      const pinnedDatasets = get().pinnedDatasets;

      if (Array.isArray(pinnedDatasets)) {
        return pinnedDatasets.some((dataset) => dataset.uuid === datasetId);
      }

      return false;
    },
    setPinnedDatasets: (datasets) => {
      set({ pinnedDatasets: datasets });
    },
    addDataset: (dataset: Dataset) => set((state) => ({ pinnedDatasets: [...state.pinnedDatasets, dataset] })),
    removeDataset: (datasetId) =>
      set((state) => ({
        pinnedDatasets: state.pinnedDatasets.filter((dataset) => dataset.uuid !== datasetId),
      })),
    filteredPinnedDataset: [],
    setFilteredPinnedDataset: (datasets) => {
        set({ filteredPinnedDataset: datasets });
    },
    addFilteredPinnedDataset: (dataset: Dataset) => set((state) => ({ filteredPinnedDataset: [...state.filteredPinnedDataset, dataset] })),
    removeFilteredPinnedDataset: (datasetId) =>
    set((state) => ({
      filteredPinnedDataset: state.filteredPinnedDataset.filter((dataset) => dataset.uuid !== datasetId),
    })),
    isPageRefreshed: false,
    setIsPageRefreshed: (status) => {
      set({isPageRefreshed: status})
    },
  }),
  {
    name:'pinneddata-storage',
    storage: createJSONStorage(() => sessionStorage),
  }
  )
  )));

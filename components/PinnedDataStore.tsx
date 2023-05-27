import { createStore } from 'zustand';
import { useDataManager } from "../hooks/DataManager";
import { devtools } from 'zustand/middleware'

interface Dataset {
  id: number;
  uuid: string;
  title: string;
  description: string;
  attributes: object;
  owner: string;
  acl: object;
  status: string;
  message: string;
  created: string;
  ES_index_enabled: Boolean;
  collection: null;
  data: string[];
}

interface DataStore {
  pinnedDatasets: Dataset[];
  isDatasetPinned: (datasetId: string) => boolean;
  setPinnedDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
}


export const useDataStore = createStore<DataStore>()(devtools((set, get) => ({
  pinnedDatasets: [],
  isDatasetPinned: (datasetId) => {
    const pinnedDatasets = get().pinnedDatasets;

    if (pinnedDatasets) {
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
})));

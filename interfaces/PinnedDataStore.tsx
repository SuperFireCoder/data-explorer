import { create, createStore } from 'zustand';
import { useDataManager } from "../hooks/DataManager";
import { persist, createJSONStorage,devtools } from 'zustand/middleware'
import { PinnedDataset } from "./../interfaces/PinnedDataset"

interface PinnedDataStore {
  pinnedDatasets: PinnedDataset[];
  isDatasetPinned: (datasetId: string) => boolean;
  setPinnedDatasets: (datasets: PinnedDataset[]) => void;
  addDataset: (dataset: PinnedDataset) => void;
  removeDataset: (datasetId: string) => void;
  filteredPinnedDataset: PinnedDataset[];
  setFilteredPinnedDataset: (datasets: PinnedDataset[]) => void;
  addFilteredPinnedDataset: (dataset: PinnedDataset) => void;
  removeFilteredPinnedDataset: (datasetId: string) => void;
  isPageRefreshed: boolean
  setIsPageRefreshed: (status: boolean) => void;
}


export const usePinnedDataStore = create<PinnedDataStore>()(
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
    addDataset: (dataset: PinnedDataset) => set((state) => ({ pinnedDatasets: [...state.pinnedDatasets, dataset] })),
    removeDataset: (datasetId) =>
      set((state) => ({
        pinnedDatasets: state.pinnedDatasets.filter((dataset) => dataset.uuid !== datasetId),
      })),
    filteredPinnedDataset: [],
    setFilteredPinnedDataset: (datasets) => {
        set({ filteredPinnedDataset: datasets });
    },
    addFilteredPinnedDataset: (dataset: PinnedDataset) => set((state) => ({ filteredPinnedDataset: [...state.filteredPinnedDataset, dataset] })),
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
  ));

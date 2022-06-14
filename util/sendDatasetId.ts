import { getWorkFlowUrl, IS_DEVELOPMENT } from "./env";

export const sendDatasetId = (dataUuid: string) => {
    const EVENT_NAME = "select-dataset";

    if (window.parent){
        console.log("sendDatasetId: datauuid", EVENT_NAME, dataUuid);
        window.parent.postMessage({
            event_id: EVENT_NAME,
            dataset_data: {
                id:dataUuid
            }
        }, IS_DEVELOPMENT ? '*' : getWorkFlowUrl());
    }
};
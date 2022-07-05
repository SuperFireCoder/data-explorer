import { getWorkFlowUrl, IS_DEVELOPMENT } from "./env";

export const sendDatasetId = (dataUuid: string) => {
    const EVENT_NAME = "select-dataset";

    if (window.parent){
        try { 
            console.log("sendDatasetId: datauuid", EVENT_NAME, dataUuid, getWorkFlowUrl());
            window.parent.postMessage({
                event_id: EVENT_NAME,
                dataset_data: {
                    id:dataUuid
                }
            }, IS_DEVELOPMENT ? '*' : getWorkFlowUrl());
        } catch (error){
            console.error(error);
        }
    }
};
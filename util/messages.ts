import { getWorkFlowUrl, IS_DEVELOPMENT } from "./env";

export const sendDatasetId = (dataUuid: string) => {
    const EVENT_NAME = "select-dataset";
    const TARGET_ORIGIN = IS_DEVELOPMENT ? '*' : getWorkFlowUrl();

    if (window.parent){
        try {
            window.parent.postMessage({
                event_id: EVENT_NAME,
                dataset_data: {
                    id:dataUuid
                }
            }, TARGET_ORIGIN);

            console.log("messages.sendDatasetId: datauuid", EVENT_NAME, dataUuid, TARGET_ORIGIN);
        } catch (error){
            console.error(error);
        }
    }
};
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import { KeycloakInstance } from "../interfaces/Keycloak";

const ENDPOINTS = {
    DATASET: "/api/dataset/",
};

export class DataManager {
    private readonly axios: AxiosInstance;

    constructor(
        public readonly serverBaseUrl: string,
        private readonly keycloakInstance: KeycloakInstance | undefined
    ) {
        this.axios = this.initNewAxiosInstance();
    }

    public getAuthorizationHeaderValue() {
        if (this.keycloakInstance === undefined) {
            return undefined;
        }

        return `Bearer ${this.keycloakInstance.token}`;
    }

    private initNewAxiosInstance() {
        const authHeaderVal = this.getAuthorizationHeaderValue();

        const axiosRequestConfig: AxiosRequestConfig = {
            baseURL: this.serverBaseUrl,
        };

        if (authHeaderVal) {
            axiosRequestConfig.headers = {
                Authorization: this.getAuthorizationHeaderValue(),
            };
        }

        return axios.create(axiosRequestConfig);
    }

    private getNewAxiosCancellationToken() {
        return axios.CancelToken.source();
    }

    private xhrGet<T>(url: string) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        const axiosPromise = this.axios.get<T>(url, {
            cancelToken: cancellationToken.token,
        });
        const promise = axiosPromise.then((res) => res.data);
        return { promise, cancellationToken, axiosPromise };
    }

    // private xhrPost<T>(url: string, data: unknown) {
    //     const cancellationToken = this.getNewAxiosCancellationToken();
    //     const axiosPromise = this.axios.post<T>(url, data, {
    //         cancelToken: cancellationToken.token,
    //     });
    //     const promise = axiosPromise.then((res) => res.data);
    //     return { promise, cancellationToken, axiosPromise };
    // }

    // private xhrDelete<T>(url: string) {
    //     const cancellationToken = this.getNewAxiosCancellationToken();
    //     const axiosPromise = this.axios.delete<T>(url, {
    //         cancelToken: cancellationToken.token,
    //     });
    //     const promise = axiosPromise.then((res) => res.data);
    //     return { promise, cancellationToken, axiosPromise };
    // }

    public getDatasetTemporaryUrl(uuid: string) {
        return this.xhrGet<{ url: string }>(
            `${ENDPOINTS.DATASET}${uuid}/tempurl`
        );
    }
}

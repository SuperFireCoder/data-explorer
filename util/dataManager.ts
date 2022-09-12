import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import { KeycloakInstance } from "../interfaces/Keycloak";

const ENDPOINTS = {
    DATASET: "/api/dataset/",
    PERMISSION: "/api/permission/",
};

export class DataManager {
    private readonly axios: AxiosInstance;

    constructor(
        public readonly serverBaseUrl: string,
        private readonly keycloakInstance:  KeycloakInstance | undefined
    ) {
        const { axiosInstance } = this.initNewAxiosInstance();
        this.axios = axiosInstance;
    }

    public getAuthorizationHeaderValue() {
        const token = this.keycloakInstance?.token;

        if (token === undefined) {
            return undefined;
        }

        return `Bearer ${token}`;
    }

    private initNewAxiosInstance() {
        const axiosInstance = axios.create({
            baseURL: this.serverBaseUrl,
        });

        const injectAuthHeaderInterceptor =
            axiosInstance.interceptors.request.use((requestConfig) => {
                const authHeader = this.getAuthorizationHeaderValue();

                // If no auth value available, just pass request through
                if (authHeader === undefined) {
                    return requestConfig;
                }

                // Otherwise inject the auth header
                return {
                    ...requestConfig,
                    headers: {
                        ...requestConfig.headers,
                        Authorization: authHeader,
                    },
                };
            });

        return { axiosInstance, injectAuthHeaderInterceptor };
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

    private xhrPost<T>(url: string, data: unknown) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        const axiosPromise = this.axios.post<T>(url, data, {
            cancelToken: cancellationToken.token,
        });
        const promise = axiosPromise.then((res) => res.data);
        return { promise, cancellationToken, axiosPromise };
    }

    private xhrDelete<T>(url: string) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        const axiosPromise = this.axios.delete<T>(url, {
            cancelToken: cancellationToken.token,
        });
        const promise = axiosPromise.then((res) => res.data);
        return { promise, cancellationToken, axiosPromise };
    }

    // private xhrDelete<T>(url: string) {
    //     const cancellationToken = this.getNewAxiosCancellationToken();
    //     const axiosPromise = this.axios.delete<T>(url, {
    //         cancelToken: cancellationToken.token,
    //     });
    //     const promise = axiosPromise.then((res) => res.data);
    //     return { promise, cancellationToken, axiosPromise };
    // }

    public getDatasetTemporaryUrl(uuid: string) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        return this.xhrGet<{ url: string }>(
            `${ENDPOINTS.DATASET}${uuid}/tempurl`
        );
    }


    public removeDataset(uuid: string) {
        return this.xhrDelete<{ url: string }>(
            `${ENDPOINTS.DATASET}${uuid}/delete`
        );
    }


    public getDatasetPermissions(uuid: string) {
        return this.xhrGet<Record<string, string[]>>(
            `${ENDPOINTS.PERMISSION}${uuid}`
        );
    }

    public updateDatasetPermissions(
        uuid: string,
        permissions: Record<string, string[]>
    ) {
        return this.xhrPost<unknown>(`${ENDPOINTS.PERMISSION}${uuid}/update`, {
            permissions,
        });
    }

    public removeDatasetPermissions(uuid: string, userIds: string[]) {
        return this.xhrPost<unknown>(`${ENDPOINTS.PERMISSION}${uuid}/delete`, {
            users: userIds,
        });
    }
}

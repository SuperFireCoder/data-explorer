import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { KeycloakInstance } from "../interfaces/Keycloak";
import { IHttpResponseError } from "../interfaces/ErrorResponse"
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

        // interceptor to handle the response
        axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            const errorResponse: IHttpResponseError = {
                title: '',
                code: "",
                description: ""
              };
        if (error.response){
            {
                errorResponse.title = error.response.data.error.title;
                errorResponse.code = error.response.data.error.code;
                errorResponse.description = error.response.data.error.description? error.response.data.error.description : undefined;
            } 
            } else {
            // Handle other errors
            errorResponse.title = "We are expriencing problem";
            errorResponse.code = "MS-001"
            errorResponse.description = "Our system is unreachable. We are on it!";
        }

        return Promise.reject(errorResponse);
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

    public xhrGet<T>(url: string) {
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

    public getDatasetFileStatus(url: string) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        return this.xhrGet<{ url: string, status: string }>(url);
    }


    public getDatasetTemporaryUrl(uuid: string) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        return this.xhrGet<{ url: string, status: string }>(
            `${ENDPOINTS.DATASET}${uuid}/tempurl`
        );
    }


    public removeDataset(uuid: string) {
        return this.xhrDelete<{}>(
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

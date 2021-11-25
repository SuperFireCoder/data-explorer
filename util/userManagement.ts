import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { UserInfo } from "../interfaces/UserManagement";

import { KeycloakInstance } from "../interfaces/Keycloak";

const ENDPOINTS = {
    USERS: "/api/users/",
};

export class UserManagement {
    private readonly axios: AxiosInstance;

    constructor(
        public readonly serverBaseUrl: string,
        private readonly keycloakInstance: KeycloakInstance
    ) {
        this.axios = this.initNewAxiosInstance();
    }

    public getAuthorizationHeaderValue() {
        return `Bearer ${this.keycloakInstance.token}`;
    }

    private initNewAxiosInstance() {
        return axios.create({
            baseURL: this.serverBaseUrl,
            headers: {
                Authorization: this.getAuthorizationHeaderValue(),
            },
        });
    }

    private getNewAxiosCancellationToken() {
        return axios.CancelToken.source();
    }

    private xhrGet<T>(url: string, config?: AxiosRequestConfig) {
        const cancellationToken = this.getNewAxiosCancellationToken();
        const axiosPromise = this.axios.get<T>(url, {
            cancelToken: cancellationToken.token,
            ...config,
        });
        const promise = axiosPromise.then((res) => res.data);
        return { promise, cancellationToken, axiosPromise };
    }

    // private xhrPost<T>(
    //     url: string,
    //     data: unknown,
    //     config?: AxiosRequestConfig
    // ) {
    //     const cancellationToken = this.getNewAxiosCancellationToken();
    //     const axiosPromise = this.axios.post<T>(url, data, {
    //         cancelToken: cancellationToken.token,
    //         ...config,
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

    public lookupUserByEmail(
        email: string | readonly string[],
        config?: AxiosRequestConfig
    ) {
        const value = (typeof email === "string" ? [email] : email).join(",");

        return this.xhrGet<[] | [UserInfo]>(`${ENDPOINTS.USERS}`, {
            params: {
                email: value,
            },
            ...config,
        });
    }
    public lookupUserById(
        id: string | readonly string[],
        config?: AxiosRequestConfig
    ) {
        const value = (typeof id === "string" ? [id] : id).join(",");

        return this.xhrGet<[] | [UserInfo]>(`${ENDPOINTS.USERS}`, {
            params: {
                id: value,
            },
            ...config,
        });
    }
}

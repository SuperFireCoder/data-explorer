export interface UserInfo {
    id: string;
    createdTimestamp: number;
    username: string;
    enabled: boolean;
    firstName?: string;
    lastName?: string;
    email: string;
    attributes: Record<string, unknown>;
}

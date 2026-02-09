import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface SchroedingkOrder {
    bookTitle: string;
    transferDate: string;
    transferEntity: string;
    reminderDate: string;
    notes: string;
    orderNumber: string;
}
export interface SensitiveFile {
    id: bigint;
    file: ExternalBlob;
    filename: string;
    uploadedBy: Principal;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrder(order: SchroedingkOrder): Promise<bigint>;
    deleteOrder(id: bigint): Promise<void>;
    getAllOrders(): Promise<Array<SchroedingkOrder>>;
    getAllSensitiveFiles(): Promise<Array<[bigint, SensitiveFile]>>;
    getAllSensitiveWords(): Promise<Array<[bigint, string]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrder(id: bigint): Promise<SchroedingkOrder>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeSensitiveWord(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveSensitiveWord(word: string): Promise<bigint>;
    updateOrder(id: bigint, order: SchroedingkOrder): Promise<void>;
    updateSensitiveWord(id: bigint, word: string): Promise<void>;
    uploadSensitiveFile(blob: ExternalBlob, filename: string): Promise<bigint>;
}

export class ApiError extends Error { status: number; constructor(message: string, status?: number) }
export interface Filters { apns: string[]; type?: string; status?: string; dateFrom?: string; dateTo?: string; modules?: string[] }
export interface RecordResult { id: string; permitId: string; status: string; description: string; type: string; dateCreated: string; apns: string[] }
export interface SearchResult { records: RecordResult[]; failures: Array<{apn:string;message:string}>; parcelCount:number; successfulParcels:number; complete:boolean; dateField:string; queriedAt:string }
export interface Client { all(path:string, options?: {body?:unknown;signal?:AbortSignal}):Promise<any[]> }
export function validateSearch(body: unknown, maxParcels?:number): Filters
export function searchBody(apn:string, filters:Filters): object
export function createClient(options:{appId:string;token?:string;agency?:string;environment?:string;maxPages?:number;fetchImpl?:typeof fetch}):Client
export function searchParcels(client:Client, filters:Filters, concurrency?:number, signal?:AbortSignal, onProgress?:(progress:{completed:number;total:number;recordCount:number;failureCount:number})=>void, maxRecords?:number):Promise<SearchResult>

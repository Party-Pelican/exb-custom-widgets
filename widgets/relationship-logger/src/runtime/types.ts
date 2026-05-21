import type { DataRecord } from "jimu-core";

/**
 * Related records keyed first by source record ID, then by target datasource ID.
 * Structure: { [sourceRecordId]: { [targetDsId]: DataRecord[] } }
 */
export type RelatedRecordsByDs = Record<string, Record<string, DataRecord[]>>;

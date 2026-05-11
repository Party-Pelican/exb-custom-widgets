import type { ImmutableObject } from "seamless-immutable";
import type { UseDataSource } from "jimu-core";

export interface RelationshipRule {
  id: string;
  sourceUseDataSource?: UseDataSource;
  sourceDataSourceId: string;
  sourceDataSourceField: string; // field to read from the source datasource
  targetDataSourceField: string; // field to write on the intermediate table
}

export interface Config {
  intermediateUseDataSource?: UseDataSource;
  intermediateDataSourceId: string;
  rules: RelationshipRule[];
  /** Per-datasource selection mode. "one" = only first selected record; "many" = all selected records. Default: "many". */
  sourceSelectionModes: Record<string, "one" | "many">;
  /** Per-datasource custom stepper step title. Falls back to the layer name when absent. */
  stepperTitles: Record<string, string>;
  /** Per-datasource message shown when no features are selected. Falls back to a default when absent. */
  noSelectionMessages: Record<string, string>;
}

export type IMConfig = ImmutableObject<Config>;

import {
  UseDataSource,
  type ImmutableObject,
  type ImmutableArray,
} from "jimu-core";

export type FieldRelate = {
  type: "field-relate";
  label: string;
  sourceField: string;
  targetDataSource: UseDataSource;
  targetField: string;
};

export type JunctionRelate = {
  type: "junction-table";
  label: string;
  sourceField: string;
  junctionDataSource: UseDataSource;
  junctionSourceField: string;
  junctionTargetField: string;
  targetDataSource: UseDataSource;
  targetField: string;
};

export type RelationshipDefinition = FieldRelate | JunctionRelate;

export interface Config {
  sourceData: UseDataSource;
  relationships: RelationshipDefinition[];
}

export type IMConfig = ImmutableObject<Config>;
export type IMRelationshipDefinition = ImmutableObject<RelationshipDefinition>;

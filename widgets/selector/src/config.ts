import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  useMapViewIds: string[];
}

export type IMConfig = ImmutableObject<Config>;

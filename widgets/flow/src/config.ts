import type { ImmutableObject } from "seamless-immutable";

export interface Config {
  listHeading: string;
  listDescription: string;
}

export type IMConfig = ImmutableObject<Config>;

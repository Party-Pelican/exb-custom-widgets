import { type ImmutableObject } from "seamless-immutable";
import { type PanelConfig } from "./panel-config.types";

export interface Config {
  panel: PanelConfig;
}

export type IMConfig = ImmutableObject<Config>;

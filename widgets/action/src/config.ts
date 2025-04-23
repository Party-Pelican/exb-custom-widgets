import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  text: string;
  alignment: "center" | "end" | "start";
  appearance: "solid" | "transparent";
  indicator: boolean;
  scale: "s" | "m" | "l";
  textEnabled: boolean;
}

export type IMConfig = ImmutableObject<Config>;

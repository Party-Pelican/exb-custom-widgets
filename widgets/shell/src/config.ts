import { type ImmutableObject } from "seamless-immutable";
import { type ShellConfig } from "./shell-config.types";

export interface Config {
  shell: ShellConfig;
}

export type IMConfig = ImmutableObject<Config>;

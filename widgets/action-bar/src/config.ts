import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  expandDisabled: boolean;
  expanded: boolean;
  layout: "horizontal" | "vertical";
  overlayPositioning: "absolute" | "fixed";
  position: "end" | "start";
  scale: "l" | "m" | "s";
}

export type IMConfig = ImmutableObject<Config>;

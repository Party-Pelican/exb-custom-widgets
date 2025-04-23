import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  panel: {
    closable: boolean;
    closed: boolean;
    collapsed: boolean;
    collapsible: boolean;
    disabled: boolean;
    heading: string;
    headingLevel: number;
    menuPlacement:
      | "auto"
      | "auto-end"
      | "auto-start"
      | "bottom"
      | "bottom-end"
      | "bottom-start"
      | "leading"
      | "leading-end"
      | "leading-start"
      | "left"
      | "left-end"
      | "left-start"
      | "right"
      | "right-end"
      | "right-start"
      | "top"
      | "top-end"
      | "top-start"
      | "trailing"
      | "trailing-end"
      | "trailing-start";
    overlayPositioning: "absolute" | "fixed";
    scale: "l" | "m" | "s";
  };
}

export type IMConfig = ImmutableObject<Config>;

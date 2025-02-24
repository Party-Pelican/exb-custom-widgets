import React from "react";

export const displayModes = ["dock", "overlay", "float"] as const;

export type DisplayMode = (typeof displayModes)[number];

export interface ShellPanelConfig {
  collapsed: boolean;
  displayMode: DisplayMode;
  height: "l" | "m" | "s";
  width: "l" | "m" | "s";
  layout: "horizontal" | "vertical";
  position: "start";
  resizable: boolean;
}

export interface SlotsVisibilityConfig {
  default?: boolean;
  "panel-start"?: boolean;
  "panel-top"?: boolean;
  "panel-end"?: boolean;
  "panel-bottom"?: boolean;
}

export type ShellConfig = {
  contentBehind: boolean;
  slotsVisibility: SlotsVisibilityConfig;
  default: ShellPanelConfig;
  "panel-start": ShellPanelConfig;
  "panel-end": ShellPanelConfig;
  "panel-top": ShellPanelConfig;
  "panel-bottom": ShellPanelConfig;
};

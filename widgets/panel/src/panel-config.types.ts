import React from "react";

export interface SlotsVisibilityConfig {
  default?: true;
  alerts?: false;
  dialogs?: false;
  header?: false;
  footer?: false;
  modals?: false;
  sheets?: false;
  "panel-start"?: false;
  "panel-top"?: false;
  "panel-end"?: false;
  "panel-bottom"?: false;
}

export type PanelConfig = {
  slotsVisibility: SlotsVisibilityConfig;
};

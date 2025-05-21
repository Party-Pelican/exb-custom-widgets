/**
  Licensing

  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { type ImmutableObject } from "jimu-core";

export type Action = {
  appearance: "solid" | "transparent";
  icon: string;
  label: string | null;
  text: string;
  textEnabled: boolean;
  alignment: "start" | "end" | "center";
};

export interface Config {
  selectedItemId: string;
  shell: {
    contentBehind: boolean;
  };
  panel: {
    closable: boolean;
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
  };
  shellPanel: {
    slot: "panel-start" | "panel-end" | "panel-top" | "panel-bottom";
    collapsed: boolean;
    displayMode: "dock" | "float-all" | "float-content" | "overlay";
    layout: "vertical" | "horizontal";
    position: "start" | "end";
    resizable: boolean;
  };
  actionBar: {
    expandDisabled: boolean;
    expanded: boolean;
    layout: "vertical" | "horizontal";
    position: "start" | "end";
  };
  actions: Action[];
}

export type IMConfig = ImmutableObject<Config>;

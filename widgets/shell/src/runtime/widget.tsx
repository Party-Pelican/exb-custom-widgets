import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import {
  CalciteShell,
  CalciteShellPanel,
  CalciteSheet,
  CalciteModal,
  CalciteAlert,
} from "calcite-components";
import { LayoutItemInBuilder } from "jimu-layouts/layout-builder";
import { LayoutEntry } from "jimu-layouts/layout-runtime";
import SlotPlaceholder from "../../components/slot-placeholder/slot-placeholder";
import { useState } from "react";

const SlotComponents = {
  alerts: CalciteAlert,
  modals: CalciteModal,
  "panel-left": CalciteShellPanel,
  "panel-top": CalciteShellPanel,
  "panel-right": CalciteShellPanel,
  "panel-bottom": CalciteShellPanel,
  sheets: CalciteSheet,
};

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const LayoutComponent = !window.jimuConfig.isInBuilder
    ? LayoutEntry
    : props.builderSupportModules.widgetModules.LayoutBuilder;

  if (LayoutComponent == null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        No layout component!
      </div>
    );
  }

  return (
    <CalciteShell>
      {Object.entries(props.config?.shell?.slotsVisibility).map(
        ([slot, isVisible]) => {
          const SlotComponent = SlotComponents[slot];
          return isVisible && SlotComponent ? (
            <SlotComponent key={slot} position={"start"}></SlotComponent>
          ) : null;
        }
      )}
    </CalciteShell>
  );
}

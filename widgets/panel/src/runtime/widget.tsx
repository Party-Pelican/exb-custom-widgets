import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { CalciteShell } from "calcite-components";
import { LayoutItemInBuilder } from "jimu-layouts/layout-builder";
import { LayoutEntry } from "jimu-layouts/layout-runtime";
import SlotPlaceholder from "../../components/slot-placeholder/slot-placeholder";

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
      {props.layouts &&
        Object.entries(props.config?.panel?.slotsVisibility || {}).map(
          ([slot, isVisible]) => {
            if (isVisible) {
              console.log("Rendering Slot", slot, props.layouts[slot]);
              return (
                <div
                  slot={slot != "default" ? slot : null}
                  id={slot}
                  className="widget-fixed-layout d-flex w-100 h-100"
                >
                  <LayoutComponent
                    layouts={props.layouts[slot]}
                    isInWidget
                    style={{
                      overflow: "auto",
                      minHeight: "none",
                    }}
                  ></LayoutComponent>
                </div>
              );
            }
          }
        )}
    </CalciteShell>
  );
}

import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import {
  CalciteShell,
  CalciteShellPanel,
  CalciteSheet,
  CalciteModal,
  CalciteAlert,
  CalcitePanel,
  CalciteActionBar,
} from "calcite-components";
import { LayoutEntry } from "jimu-layouts/layout-runtime";
import { WidgetPlaceholder } from "jimu-ui";

const SlotComponents = {
  default: CalcitePanel,
  alerts: CalciteAlert,
  modals: CalciteModal,
  "panel-start": CalciteShellPanel,
  "panel-top": CalciteShellPanel,
  "panel-end": CalciteShellPanel,
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

  console.log(props.layouts);

  return (
    <CalciteShell style={{ backgroundColor: "transparent" }}>
      {props.layouts &&
        Object.entries(props.config?.shell?.slotsVisibility).map(
          ([slot, isVisible]) => {
            const SlotComponent = SlotComponents[slot];
            if (isVisible && SlotComponent && slot !== "default") {
              return (
                <SlotComponent
                  key={slot}
                  slot={slot}
                  style={{ border: "1px solid black" }}
                  {...props.config.shell[slot]}
                >
                  <LayoutComponent
                    isInWidget
                    layout={props.layouts[slot]}
                    style={{
                      overflow: "auto",
                      minHeight: "none",
                    }}
                  />
                </SlotComponent>
              );
            } else if (isVisible && SlotComponent && slot == "default") {
              console.log(props.layouts[slot]);
              return (
                <SlotComponent
                  key={slot}
                  heading={slot}
                  className="widget-fixed-layout"
                  {...props.config.shell[slot]}
                >
                  <LayoutComponent
                    layout={props.layouts[slot]}
                    style={{
                      overflow: "auto",
                      minHeight: "none",
                    }}
                  >
                    <WidgetPlaceholder
                      widgetId={props.id}
                      icon={""}
                      style={{
                        border: "none",
                      }}
                    />
                  </LayoutComponent>
                </SlotComponent>
              );
            }
          }
        )}
    </CalciteShell>
  );
}

import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import {
  CalciteShell,
  CalciteShellPanel,
  CalcitePanel,
} from "calcite-components";
import { LayoutEntry } from "jimu-layouts/layout-runtime";

const SlotComponents = {
  default: CalcitePanel,
  "panel-start": CalciteShellPanel,
  "panel-top": CalciteShellPanel,
  "panel-end": CalciteShellPanel,
  "panel-bottom": CalciteShellPanel,
};

export default function Widget(props: AllWidgetProps<IMConfig>) {
  let LayoutComponent: typeof LayoutEntry;
  if (window.jimuConfig.isInBuilder) {
    LayoutComponent = props.builderSupportModules.LayoutEntry;
  } else {
    LayoutComponent = LayoutEntry;
  }

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

  console.log(props.config.shell);

  return (
    <CalciteShell
      id="shell-widget"
      style={{ backgroundColor: "transparent" }}
      contentBehind={props.config.shell.contentBehind}
    >
      {props.layouts &&
        Object.entries(props.config?.shell?.slotsVisibility).map(
          ([slot, isVisible]) => {
            const SlotComponent = SlotComponents[slot];
            if (isVisible && SlotComponent && slot !== "default") {
              return (
                <SlotComponent
                  key={slot}
                  slot={slot}
                  {...props.config.shell[slot]}
                >
                  <LayoutComponent
                    isInWidget
                    layouts={props.layouts[slot]}
                    className="h-100 w-100"
                  />
                </SlotComponent>
              );
            } else if (isVisible && SlotComponent && slot == "default") {
              return (
                <SlotComponent
                  key={slot}
                  id={slot}
                  heading={slot}
                  {...props.config.shell[slot]}
                >
                  <LayoutComponent
                    isInWidget
                    layouts={props.layouts[slot]}
                    className="h-100 w-100"
                  ></LayoutComponent>
                </SlotComponent>
              );
            }
          }
        )}
    </CalciteShell>
  );
}

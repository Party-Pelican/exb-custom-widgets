import { type AllWidgetProps, React } from "jimu-core";
import { type IMConfig } from "../config";

import Layout from "./layout/runtime/layout";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const LayoutComponent = !window.jimuConfig.isInBuilder
    ? Layout
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

  const [panelLayoutName, mainLayoutName] = Object.keys(props.layouts);

  const panelLayout = props.layouts[panelLayoutName];
  const mainLayout = props.layouts[mainLayoutName];

  return (
    <div className="w-100 h-100">
      <LayoutComponent
        layouts={panelLayout}
        mainLayout={mainLayout}
        panelLayout={panelLayout}
        config={props.config}
      ></LayoutComponent>
    </div>
  );
}

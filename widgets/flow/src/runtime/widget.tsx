import { React, type AllWidgetProps } from "jimu-core";
import type { IMConfig } from "../config";
import "calcite-components";

import Layout from "./layout/runtime/layout";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  console.log("Flow Component", props);

  const LayoutComponent = !window.jimuConfig.isInBuilder
    ? Layout
    : props.builderSupportModules?.widgetModules?.LayoutBuilder;

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
    <div className="w-100 h-100">
      <LayoutComponent {...props}></LayoutComponent>
    </div>
  );
};

export default Widget;

import { type AllWidgetProps, IMState, React } from "jimu-core";
import { type IMConfig } from "../config";

import Layout from "./layout/runtime/layout";
import { useSelector } from "react-redux";

interface ExtraProps {
  locale: string;
}

export default function Widget(props: AllWidgetProps<IMConfig> & ExtraProps) {
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

  const layoutName = Object.keys(props.layouts)[0];

  console.log("layoutName", props.layouts[layoutName]);

  return (
    <div className="w-100 h-100">
      <LayoutComponent layouts={props.layouts[layoutName]}></LayoutComponent>
    </div>
  );
}

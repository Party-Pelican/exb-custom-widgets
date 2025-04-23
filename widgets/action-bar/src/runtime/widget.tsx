import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { CalciteActionBar } from "calcite-components";
import { LayoutEntry } from "jimu-layouts/layout-runtime";
// import LayoutEntry from "../layout/runtime/layout";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  console.group("Action Bar");
  console.log(props);
  console.groupEnd();

  let LayoutEntryComponent;
  if (window.jimuConfig.isInBuilder) {
    LayoutEntryComponent =
      props.builderSupportModules.widgetModules.ActionBarLayoutBuilder;
  } else {
    LayoutEntryComponent = LayoutEntry;
  }

  const layoutName = Object.keys(props.layouts)[0];

  return (
    <CalciteActionBar {...props.config}>
      <LayoutEntryComponent
        isInWidget
        layouts={props.layouts[layoutName]}
        currentlayoutId={props.layouts[layoutName]}
      >
        <div>Test Div</div>
      </LayoutEntryComponent>
    </CalciteActionBar>
  );
}

import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { CalciteAction } from "calcite-components";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  return <CalciteAction {...props.config}></CalciteAction>;
}

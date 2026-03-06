import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { CalciteDatePicker } from "calcite-components";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  return <CalciteDatePicker></CalciteDatePicker>;
}

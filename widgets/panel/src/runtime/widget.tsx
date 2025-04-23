import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import {
  CalciteActionBar,
  CalciteShellPanel,
  CalciteAction,
} from "calcite-components";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  console.log(props.config);
  return (
    <CalciteShellPanel>
      <CalciteActionBar slot="action-bar">
        <CalciteAction text="test" icon="question"></CalciteAction>
        <CalciteAction text="test 2" icon="save"></CalciteAction>
      </CalciteActionBar>
    </CalciteShellPanel>
  );
}

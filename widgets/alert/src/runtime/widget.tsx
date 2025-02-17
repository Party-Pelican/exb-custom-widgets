import { React, AllWidgetProps } from "jimu-core";
import { useEffect, useRef, useState } from "react";
import { IMConfig, AlertProps } from "../config";
import { CalciteAlert } from "calcite-components";
import { isEqual } from "lodash-es";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const alertConfig = props.stateProps?.alertConfig ?? props.config.alertConfig;

  console.log(alertConfig);

  return (
    <CalciteAlert {...alertConfig}>
      <div slot="title">{alertConfig.title}</div>
      <div slot="message">{alertConfig.message}</div>
    </CalciteAlert>
  );
}

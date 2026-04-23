import {
  appActions,
  getAppStore,
  IMSizeModeLayoutJson,
  IMState,
  LayoutItemType,
  React,
} from "jimu-core";

import { WidgetRenderer, utils } from "jimu-layouts/layout-runtime";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type IMConfig, type Action } from "../../../config";

type LayoutRuntimeProps = {
  config: IMConfig;
  mainLayout: IMSizeModeLayoutJson;
  panelLayout: IMSizeModeLayoutJson;
  widgetId: string;
  selectedItemId: string;
};

export default function Layout(props: LayoutRuntimeProps) {
  return <div>Flow Layout Runtime</div>;
}

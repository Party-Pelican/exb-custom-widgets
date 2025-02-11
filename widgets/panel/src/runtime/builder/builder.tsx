import {
  React,
  jsx,
  ReactRedux,
  type IMState,
  appActions,
  getAppStore,
  css,
  type LayoutItemConstructorProps,
  BrowserSizeMode,
  hooks,
  AppMode,
  Immutable,
  type Size,
} from "jimu-core";

export default function SlotBuilder() {
  return <div className="controller-builder w-100 h-100"></div>;
}

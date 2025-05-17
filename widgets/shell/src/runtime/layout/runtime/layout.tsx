import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import {
  getAppStore,
  IMSizeModeLayoutJson,
  IMState,
  LayoutItemType,
  React,
  ReactRedux,
} from "jimu-core";

import {
  WidgetRenderer,
  LayoutProps,
  utils,
} from "jimu-layouts/layout-runtime";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { type IMConfig, type Action } from "../../../config";

type LayoutRuntimeProps = {
  config: IMConfig;
  mainLayout: IMSizeModeLayoutJson;
  panelLayout: IMSizeModeLayoutJson;
};

const defaultAction = {
  appearance: "solid",
  icon: "widgets-group",
  label: "widget",
  text: "widget",
  textEnabled: true,
  alignment: "start",
} as Action;

export default function Layout(props: LayoutRuntimeProps) {
  console.log("runtime props", props);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const panelLayout = useMemo(() => props.panelLayout, [props.panelLayout]);
  const mainLayout = useMemo(() => props.mainLayout, [props.mainLayout]);
  const shellConfig = useMemo(() => props.config.shell, [props.config.shell]);
  const panelConfig = useMemo(() => props.config.panel, [props.config.panel]);
  const shellPanelConfig = useMemo(
    () => props.config.shellPanel,
    [props.config.shellPanel]
  );
  const actionBarConfig = useMemo(
    () => props.config.actionBar,
    [props.config.actionBar]
  );

  const panelLayoutProps = useMemo(
    () =>
      utils.mapStateToLayoutProps(getAppStore().getState(), {
        layouts: panelLayout,
      }),
    [panelLayout]
  );

  const mainLayoutProps = useMemo(
    () =>
      utils.mapStateToLayoutProps(getAppStore().getState(), {
        layouts: mainLayout,
      }),
    [mainLayout]
  );

  const selectedWidgetProps = useMemo(() => {
    if (!selectedItemId || !panelLayoutProps?.layout?.id) return null;

    return utils.mapStateToWidgetProps(getAppStore().getState(), {
      layoutId: panelLayoutProps.layout.id,
      layoutItemId: selectedItemId,
    });
  }, [selectedItemId, panelLayoutProps?.layout?.id]);

  const mainWidgetProps = useMemo(() => {
    if (!mainLayoutProps?.layout?.id) return null;

    const layout =
      getAppStore().getState().appConfig.layouts[mainLayoutProps.layout.id];
    const layoutItem = layout?.content && Object.values(layout.content)[0];

    if (layoutItem?.type === LayoutItemType.Widget) {
      return utils.mapStateToWidgetProps(getAppStore().getState(), {
        layoutId: mainLayoutProps.layout.id,
        layoutItemId: layoutItem.id,
      });
    }

    return null;
  }, [mainLayoutProps?.layout?.id]);

  const selectedItem =
    selectedItemId && panelLayoutProps?.layout?.content?.[selectedItemId];

  const mainItem = mainLayoutProps ? mainLayoutProps.layout.content[0] : null;

  const actionButtons = useMemo(() => {
    return Object.entries(panelLayoutProps.layout.content).map(
      ([id, item], i) => (
        <CalciteAction
          key={id}
          {...(props.config.actions[i] || defaultAction)}
          onClick={() => setSelectedItemId(id)}
        />
      )
    );
  }, [panelLayoutProps.layout.content, props.config.actions]);

  const selectedWidgetLabel = useSelector((state: IMState) => {
    if (!selectedItem) return "";
    const widgetId = selectedItem.widgetId;
    return state.appConfig.widgets?.[widgetId]?.label || "";
  });

  return (
    <>
      <CalciteShell {...shellConfig}>
        <CalciteShellPanel
          {...shellPanelConfig}
          collapsed={selectedItemId === null}
        >
          <CalciteActionBar slot="action-bar" {...actionBarConfig}>
            {actionButtons}
          </CalciteActionBar>
          {selectedItem && (
            <CalcitePanel
              {...panelConfig}
              heading={selectedWidgetLabel}
              onCalcitePanelClose={() => setSelectedItemId(null)}
              data-layoutitemid={selectedItemId}
              data-layoutid={panelLayoutProps.layout.id}
            >
              {selectedWidgetProps && (
                <WidgetRenderer
                  className={"d-flex w-100 h-100 overflow-auto"}
                  layoutId={panelLayoutProps.layout.id}
                  layoutItemId={selectedItemId}
                  {...selectedWidgetProps}
                />
              )}
            </CalcitePanel>
          )}
        </CalciteShellPanel>
        {mainWidgetProps && (
          <CalcitePanel>
            <WidgetRenderer
              className={"w-100 h-100"}
              layoutId={mainLayoutProps.layout.id}
              layoutItemId={mainItem.id}
              {...mainWidgetProps}
            />
          </CalcitePanel>
        )}
      </CalciteShell>
    </>
  );
}

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
import { type IMConfig } from "../../../config";

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
} as any;

export default function Layout(props: LayoutRuntimeProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const appStore = getAppStore();
  const appConfig = appStore.getState().appConfig;
  console.log("runtime props", props);

  const panelLayout = useMemo(() => props.panelLayout, [props.panelLayout]);
  const mainLayout = useMemo(() => props.mainLayout, [props.mainLayout]);

  const { panelLayoutProps, mainLayoutProps } = useSelector(
    (state: IMState) => {
      return {
        panelLayoutProps: utils.mapStateToLayoutProps(state, {
          layouts: panelLayout,
        }),
        mainLayoutProps: utils.mapStateToLayoutProps(state, {
          layouts: mainLayout,
        }),
      };
    }
  );

  const selectedWidgetProps = useSelector((state: IMState) => {
    if (!selectedItemId || !panelLayoutProps?.layout?.id) return null;

    const layout = state.appConfig.layouts[panelLayoutProps.layout.id];
    const layoutItem = layout?.content?.[selectedItemId];

    if (layoutItem?.type === LayoutItemType.Widget) {
      return utils.mapStateToWidgetProps(state, {
        layoutId: panelLayoutProps.layout.id,
        layoutItemId: selectedItemId,
      });
    }

    return null;
  }, ReactRedux.shallowEqual);

  const mainWidgetProps = useSelector((state: IMState) => {
    if (!mainLayoutProps?.layout?.id) return null;

    const layout = state.appConfig.layouts[mainLayoutProps.layout.id];
    const layoutItem = layout?.content && Object.values(layout.content)[0];

    if (layoutItem?.type === LayoutItemType.Widget) {
      return utils.mapStateToWidgetProps(state, {
        layoutId: mainLayoutProps.layout.id,
        layoutItemId: layoutItem.id,
      });
    }

    return null;
  });

  const selectedItem =
    selectedItemId && panelLayoutProps?.layout?.content?.[selectedItemId];

  const mainItem = mainLayoutProps ? mainLayoutProps.layout.content[0] : null;

  const actionButtons = Object.entries(panelLayoutProps.layout.content).map(
    ([id, item], i) => (
      <CalciteAction
        key={id}
        {...(props.config.actions[i] || defaultAction)}
        onClick={() => setSelectedItemId(id)}
      />
    )
  );
  return (
    <>
      <CalciteShell {...props.config.shell}>
        <CalciteShellPanel
          {...props.config.shellPanel}
          collapsed={selectedItemId === null}
        >
          <CalciteActionBar slot="action-bar" {...props.config.actionBar}>
            {actionButtons}
          </CalciteActionBar>
          {selectedItem && (
            <CalcitePanel
              {...props.config.panel}
              heading={appConfig.widgets[selectedItem.widgetId].label}
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

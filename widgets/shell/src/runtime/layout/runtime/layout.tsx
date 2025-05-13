import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import {
  getAppStore,
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
import { useState } from "react";
import { useSelector } from "react-redux";
import { type IMConfig } from "../../../config";

const defaultAction = {
  appearance: "solid",
  icon: "widgets-group",
  label: "widget",
  text: "widget",
  textEnabled: true,
  alignment: "start",
} as any;

export default function Layout(props: LayoutProps & { config: IMConfig }) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const appStore = getAppStore();
  const appConfig = appStore.getState().appConfig;

  const layoutFromRedux = useSelector((state: IMState) =>
    utils.mapStateToLayoutProps(state, props)
  );

  const widgetProps = useSelector((state: IMState) => {
    if (!selectedItemId || !layoutFromRedux?.layout?.id) return null;

    const layout = state.appConfig.layouts[layoutFromRedux.layout.id];
    const layoutItem = layout?.content?.[selectedItemId];

    if (layoutItem?.type === LayoutItemType.Widget) {
      return utils.mapStateToWidgetProps(state, {
        layoutId: layoutFromRedux.layout.id,
        layoutItemId: selectedItemId,
      });
    }

    return null;
  }, ReactRedux.shallowEqual);

  const selectedItem = selectedItemId
    ? layoutFromRedux.layout.content[selectedItemId]
    : null;
  return (
    <>
      <CalciteShell {...props.config.shell}>
        <CalciteShellPanel slot="panel-start" {...props.config.shellPanel}>
          <CalciteActionBar slot="action-bar" {...props.config.actionBar}>
            {Object.entries(layoutFromRedux.layout.content).map(
              ([id, item], i) => (
                <CalciteAction
                  key={id}
                  {...(props.config.actions[i]
                    ? props.config.actions[i]
                    : defaultAction)}
                  onClick={() => setSelectedItemId(id)}
                />
              )
            )}
          </CalciteActionBar>
          {selectedItem && (
            <CalcitePanel
              {...props.config.panel}
              heading={appConfig.widgets[selectedItem.widgetId].label}
              onCalcitePanelClose={() => setSelectedItemId(null)}
              data-layoutitemid={selectedItemId}
              data-layoutid={layoutFromRedux.layout.id}
            >
              {/* Replace this with your actual widget rendering logic */}
              <WidgetRenderer
                className={"d-flex w-100 h-100 overflow-auto"}
                layoutId={layoutFromRedux.layout.id}
                layoutItemId={selectedItemId}
                {...widgetProps}
              />
            </CalcitePanel>
          )}
        </CalciteShellPanel>
      </CalciteShell>
    </>
  );
}

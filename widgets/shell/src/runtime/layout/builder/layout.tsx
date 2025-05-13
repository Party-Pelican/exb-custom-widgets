import {
  IMState,
  type LayoutItemConstructorProps,
  React,
  getAppStore,
  appActions,
  LayoutItemType,
  ReactRedux,
} from "jimu-core";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import { useRef, useState } from "react";
import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import { addItemToLayout } from "jimu-layouts/layout-builder";
import { useSelector } from "react-redux";
import { utils, type LayoutProps } from "jimu-layouts/layout-runtime";
import { WidgetRendererInBuilder } from "jimu-layouts/layout-builder";
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const anchorEl = useRef<HTMLCalciteActionElement>(null);
  const appStore = getAppStore();
  const appConfig = appStore.getState().appConfig;
  console.log("builder props", props);

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

  function handleOnSelect(item: LayoutItemConstructorProps) {
    addItemToLayout(appConfig, item, layoutFromRedux.layout.id)
      .then((result) => {
        console.log("result", result);
        appStore.dispatch(appActions.appConfigChanged(result.updatedAppConfig));
        setIsOpen(false);
      })
      .catch((err) => {
        console.error("addItemToLayout error", err);
      });
  }

  function handleIsAccepted(
    item: LayoutItemConstructorProps,
    isReplacePlaceholder: boolean
  ) {
    return item.itemType == "WIDGET";
  }

  function handleItemClick(itemId: string, e: React.MouseEvent) {
    e.stopPropagation();

    if (selectedItemId !== itemId) {
      setSelectedItemId(itemId);
    }
    getAppStore().dispatch(
      appActions.selectionChanged({
        layoutId: layoutFromRedux.layout.id,
        layoutItemId: itemId,
      })
    );
  }

  const selectedItem = selectedItemId
    ? layoutFromRedux.layout.content[selectedItemId]
    : null;

  return (
    <>
      {isOpen && anchorEl.current && (
        <WidgetListPopper
          referenceElement={anchorEl.current}
          isAccepted={handleIsAccepted}
          onSelect={handleOnSelect}
          onClose={() => setIsOpen(false)}
        ></WidgetListPopper>
      )}
      {props.config && (
        <CalciteShell {...props.config.shell}>
          <CalciteShellPanel slot="panel-start" {...props.config.shellPanel}>
            <CalciteActionBar slot="action-bar" {...props.config.actionBar}>
              <CalciteAction
                icon="plus"
                ref={anchorEl}
                onClick={() => setIsOpen((prevState) => !prevState)}
              ></CalciteAction>
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
                onClick={(e) =>
                  selectedItemId && handleItemClick(selectedItemId, e)
                }
              >
                {widgetProps && (
                  <WidgetRendererInBuilder
                    className={
                      "builder-layout-item d-flex w-100 h-100 overflow-auto"
                    }
                    layoutId={layoutFromRedux.layout.id}
                    layoutItemId={selectedItemId}
                    {...widgetProps}
                  />
                )}
              </CalcitePanel>
            )}
          </CalciteShellPanel>
        </CalciteShell>
      )}
    </>
  );
}

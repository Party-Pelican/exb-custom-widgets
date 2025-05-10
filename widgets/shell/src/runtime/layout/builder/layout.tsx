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
import { useDispatch, useSelector } from "react-redux";
import {
  utils,
  WidgetRenderer,
  type LayoutProps,
  type StateToLayoutProps,
} from "jimu-layouts/layout-runtime";
import {
  WidgetRendererInBuilder,
  SectionRendererInBuilder,
} from "jimu-layouts/layout-builder";

export default function Layout(props: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const anchorEl = useRef<HTMLCalciteActionElement>(null);
  const appStore = getAppStore();
  const appConfig = appStore.getState().appConfig;
  console.log("appStore", appStore);
  console.log("appConfig", appConfig);

  const layoutFromRedux = useSelector((state: IMState) =>
    utils.mapStateToLayoutProps(state, props)
  );

  console.log("layoutFromRedux", layoutFromRedux);
  console.log("props", props);

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
    console.log("item", item);
    const appStore = getAppStore();
    const appConfig = appStore.getState().appConfig;
    console.log("appStore", appStore);
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

  function handleItemClick(itemId: string) {
    console.log("Clicked Widget", itemId);
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
      <CalciteShell style={{ background: "transparent" }}>
        <CalciteShellPanel slot="panel-start" displayMode="overlay">
          <CalciteActionBar slot="action-bar">
            <CalciteAction
              icon="plus"
              ref={anchorEl}
              onClick={() => setIsOpen((prevState) => !prevState)}
            ></CalciteAction>
            {Object.entries(layoutFromRedux.layout.content).map(
              ([id, item]) => (
                <CalciteAction
                  key={id}
                  icon="widgets-group"
                  text={appConfig.widgets[item.widgetId].label}
                  onClick={() => setSelectedItemId(id)}
                />
              )
            )}
          </CalciteActionBar>
          {selectedItem && (
            <CalcitePanel
              heading={appConfig.widgets[selectedItem.widgetId].label}
              closable
              collapsible
              onCalcitePanelClose={() => setSelectedItemId(null)}
              data-layoutitemid={selectedItemId}
              data-layoutid={layoutFromRedux.layout.id}
              onClick={() => selectedItemId && handleItemClick(selectedItemId)}
            >
              {/* Replace this with your actual widget rendering logic */}
              {widgetProps && (
                <WidgetRendererInBuilder
                  className={"builder-layout-item d-flex w-100 h-100"}
                  layoutId={layoutFromRedux.layout.id}
                  layoutItemId={selectedItemId}
                  {...widgetProps}
                />
              )}
            </CalcitePanel>
          )}
        </CalciteShellPanel>
      </CalciteShell>
    </>
  );
}

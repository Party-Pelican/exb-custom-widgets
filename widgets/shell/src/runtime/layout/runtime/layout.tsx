import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import {
  appActions,
  getAppStore,
  IMState,
  LayoutItemConstructorProps,
  React,
} from "jimu-core";
import { addItemToLayout } from "jimu-layouts/layout-builder";
import {
  WidgetRenderer,
  SectionRenderer,
  LayoutProps,
  utils,
} from "jimu-layouts/layout-runtime";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";

function getWidgetNameFromIconPath(iconPath: string): string | null {
  try {
    const parts = iconPath.split("/");
    const iconIndex = parts.indexOf("icon.svg");

    // fallback if not split directly on icon.svg
    const iconFileIndex = parts.findIndex((part) => part.endsWith("icon.svg"));
    if (iconFileIndex > 0) {
      return parts[iconFileIndex - 1]; // folder before icon.svg
    }

    return null;
  } catch {
    return null;
  }
}

export default function Layout(props: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const anchorEl = useRef<HTMLCalciteActionElement>(null);
  const appStore = getAppStore();
  const appConfig = appStore.getState().appConfig;

  const layoutFromRedux = useSelector((state: IMState) =>
    utils.mapStateToLayoutProps(state, props)
  );

  console.log("layoutFromRedux", layoutFromRedux);
  console.log("props", props);

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

  const selectedItem = selectedItemId
    ? layoutFromRedux.layout.content[selectedItemId]
    : null;
  return (
    <>
      {/* {isOpen && anchorEl.current && (
        <WidgetListPopper
          referenceElement={anchorEl.current}
          isAccepted={handleIsAccepted}
          onSelect={handleOnSelect}
          onClose={() => setIsOpen(false)}
        ></WidgetListPopper>
      )} */}
      <CalciteShell style={{ background: "transparent" }}>
        <CalciteShellPanel slot="panel-start" displayMode="overlay">
          <CalciteActionBar slot="action-bar">
            {/* <CalciteAction
              icon="plus"
              ref={anchorEl}
              onClick={() => setIsOpen((prevState) => !prevState)}
            ></CalciteAction> */}
            {Object.entries(layoutFromRedux.layout.content).map(
              ([id, item]) => (
                <CalciteAction
                  key={id}
                  icon={getWidgetNameFromIconPath(
                    appConfig.widgets[item.widgetId].icon as string
                  )}
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
            >
              {/* Replace this with your actual widget rendering logic */}
              <WidgetRenderer
                className={"builder-layout-item d-flex w-100 h-100"}
                layoutId={layoutFromRedux.layout.id}
                layoutItemId={selectedItemId}
              />
            </CalcitePanel>
          )}
        </CalciteShellPanel>
      </CalciteShell>
    </>
  );
}

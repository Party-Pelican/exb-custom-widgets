import {
  IMState,
  type LayoutItemConstructorProps,
  React,
  appActions,
  LayoutItemType,
  ReactRedux,
  IMSizeModeLayoutJson,
} from "jimu-core";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import { useMemo, useRef, useState } from "react";
import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import { addItemToLayout, DropArea } from "jimu-layouts/layout-builder";
import { useSelector, useDispatch } from "react-redux";
import { utils } from "jimu-layouts/layout-runtime";
import { WidgetRendererInBuilder } from "jimu-layouts/layout-builder";
import { type IMConfig, type Action } from "../../../config";

type LayoutBuilderProps = {
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

export default function Layout(props: LayoutBuilderProps) {
  console.log("builder props", props);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const anchorEl = useRef<HTMLCalciteActionElement>(null);
  const appConfig = useSelector((state: IMState) => state.appConfig);

  const panelLayout = props.panelLayout;
  const mainLayout = props.mainLayout;

  const dispatch = useDispatch();

  const panelLayoutProps = useSelector(
    (state: IMState) =>
      utils.mapStateToLayoutProps(state, { layouts: panelLayout }),
    ReactRedux.shallowEqual
  );

  const mainLayoutProps = useSelector(
    (state: IMState) =>
      utils.mapStateToLayoutProps(state, { layouts: mainLayout }),
    ReactRedux.shallowEqual
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

  function handleOnSelect(item: LayoutItemConstructorProps) {
    addItemToLayout(appConfig, item, panelLayoutProps.layout.id)
      .then((result) => {
        dispatch(appActions.appConfigChanged(result.updatedAppConfig));
        setIsOpen(false);
      })
      .catch((err) => {
        console.error("addItemToLayout error", err);
      });
  }

  function handleOnDrop(item: LayoutItemConstructorProps) {
    addItemToLayout(appConfig, item, mainLayoutProps.layout.id)
      .then((result) => {
        dispatch(appActions.appConfigChanged(result.updatedAppConfig));
        setIsOpen(false);
      })
      .catch((err) => {
        console.error("addItemToLayout error", err);
      });
  }

  function handleIsAccepted(item: LayoutItemConstructorProps) {
    return item.itemType == "WIDGET";
  }

  function openSettings(layoutId: string, itemId: string, e: React.MouseEvent) {
    e.stopPropagation();
    dispatch(appActions.selectionChanged({ layoutId, layoutItemId: itemId }));
  }

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
          <CalciteShellPanel
            {...props.config.shellPanel}
            collapsed={selectedItemId === null}
          >
            <CalciteActionBar slot="action-bar" {...props.config.actionBar}>
              <CalciteAction
                icon="plus"
                ref={anchorEl}
                onClick={() => setIsOpen((prevState) => !prevState)}
              ></CalciteAction>
              {actionButtons}
            </CalciteActionBar>
            {selectedItem && (
              <CalcitePanel
                {...props.config.panel}
                heading={appConfig.widgets[selectedItem.widgetId].label}
                onCalcitePanelClose={() => setSelectedItemId(null)}
                data-layoutitemid={selectedItemId}
                data-layoutid={panelLayoutProps.layout.id}
                onClick={(e) =>
                  selectedItemId &&
                  openSettings(panelLayoutProps.layout.id, selectedItemId, e)
                }
              >
                {selectedWidgetProps && (
                  <WidgetRendererInBuilder
                    className={"d-flex w-100 h-100 overflow-auto"}
                    layoutId={panelLayoutProps.layout.id}
                    layoutItemId={selectedItemId}
                    {...selectedWidgetProps}
                  />
                )}
              </CalcitePanel>
            )}
          </CalciteShellPanel>
          {!mainWidgetProps ? (
            <DropArea
              className="w-100 h-100"
              layouts={mainLayout}
              onDrop={handleOnDrop}
            ></DropArea>
          ) : (
            <CalcitePanel
              onClick={(e) =>
                mainItem &&
                openSettings(mainLayoutProps.layout.id, mainItem.id, e)
              }
            >
              <WidgetRendererInBuilder
                className={"w-100 h-100"}
                layoutId={mainLayoutProps.layout.id}
                layoutItemId={mainItem.id}
                {...mainWidgetProps}
              />
            </CalcitePanel>
          )}
        </CalciteShell>
      )}
    </>
  );
}

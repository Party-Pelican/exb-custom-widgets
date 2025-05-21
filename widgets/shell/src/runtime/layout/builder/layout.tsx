import {
  IMState,
  type LayoutItemConstructorProps,
  React,
  appActions,
  LayoutItemType,
  ReactRedux,
  IMSizeModeLayoutJson,
  getAppStore,
} from "jimu-core";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import { useEffect, useMemo, useRef, useState } from "react";
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
  widgetId: string;
  selectedItemId: string;
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
  const anchorEl = useRef<HTMLCalciteActionElement>(null);
  const appConfig = useSelector((state: IMState) => state.appConfig);
  const selectedItemId = useSelector((state: IMState) => {
    return state.widgetsState[props.widgetId]
      ? state.widgetsState[props.widgetId].selectedItemId
      : `${props.config.selectedItemId}`;
  });

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

  const selectedItem =
    selectedItemId && panelLayoutProps?.layout?.content?.[selectedItemId];

  console.log(selectedItemId);

  const mainItem = mainLayoutProps?.layout?.content?.[0] ?? null;

  const actionButtons = useMemo(() => {
    if (!panelLayoutProps?.layout?.content) return null;
    return Object.entries(panelLayoutProps.layout.content).map(
      ([id, item], i) => (
        <CalciteAction
          key={id}
          {...(props.config.actions[i] || defaultAction)}
          onClick={() =>
            dispatch(
              appActions.widgetStatePropChange(
                props.widgetId,
                "selectedItemId",
                id
              )
            )
          }
        />
      )
    );
  }, [panelLayoutProps.layout.content, props.config.actions]);

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

  useEffect(() => {
    const current =
      getAppStore().getState().widgetsState?.[props.widgetId]?.selectedItemId;
    if (!current && props.config.selectedItemId) {
      dispatch(
        appActions.widgetStatePropChange(
          props.widgetId,
          "selectedItemId",
          props.config.selectedItemId
        )
      );
    }
  }, [dispatch, props.widgetId, props.config.selectedItemId]);

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
            collapsed={selectedItemId == null}
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
                onCalcitePanelClose={() =>
                  dispatch(
                    appActions.widgetStatePropChange(
                      props.widgetId,
                      "selectedItemId",
                      null
                    )
                  )
                }
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

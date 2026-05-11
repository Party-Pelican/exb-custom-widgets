import {
  React,
  type LayoutItemConstructorProps,
  type AllWidgetProps,
  IMState,
  ReactRedux,
  appActions,
  LayoutItemType,
} from "jimu-core";
import "calcite-components";
import { type IMConfig } from "../../../config";
import { useCallback, useMemo, useRef, useState } from "react";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import {
  addItemToLayout,
  WidgetRendererInBuilder,
} from "jimu-layouts/layout-builder";
import { getAppConfigAction } from "jimu-for-builder";
import { useDispatch, useSelector } from "react-redux";
import { utils } from "jimu-layouts/layout-runtime";
import {
  CalciteAction,
  CalciteBlock,
  CalciteButton,
  CalciteFlow,
  CalciteFlowItem,
  CalciteIcon,
  CalciteList,
  CalciteListItem,
} from "calcite-components";

type LayoutBuilderProps = AllWidgetProps<IMConfig>;

export default function Layout(props: LayoutBuilderProps) {
  const [isWidgetListOpen, setIsWidgetListOpen] = useState(false);

  const appConfig = useSelector((state: IMState) => state.appConfig);
  const dispatch = useDispatch();
  const [flowLayoutName] = Object.keys(props.layouts ?? {});
  const flowLayout = flowLayoutName ? props.layouts[flowLayoutName] : null;

  const flowLayoutProps = useSelector(
    (state: IMState) =>
      flowLayout
        ? utils.mapStateToLayoutProps(state, { layouts: flowLayout })
        : null,
    ReactRedux.shallowEqual,
  );

  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const addWidgetButtonRef = useRef<HTMLCalciteButtonElement>(null);

  const activeWidgetProps = useSelector((state: IMState) => {
    if (!activeItemId || !flowLayoutProps?.layout?.id) return null;

    const layout = state.appConfig.layouts[flowLayoutProps.layout.id];
    const layoutItem = layout?.content?.[activeItemId];
    // Guard: item may be undefined if it was removed or not yet committed
    if (!layoutItem || layoutItem?.type !== LayoutItemType.Widget) return null;
    return utils.mapStateToWidgetProps(state, {
      layoutId: flowLayoutProps.layout.id,
      layoutItemId: activeItemId,
    });
  }, ReactRedux.shallowEqual);

  const handleIsAccepted = (item: LayoutItemConstructorProps) => {
    return item.itemType === "WIDGET";
  };

  const handleRemoveWidget = useCallback(
    (layoutItemId: string) => {
      if (!flowLayoutProps?.layout?.id) return;
      if (activeItemId === layoutItemId) {
        setActiveItemId(null);
      }
      getAppConfigAction()
        .removeLayoutItem(
          { layoutId: flowLayoutProps.layout.id, layoutItemId },
          true,
        )
        .exec();
    },
    [activeItemId, flowLayoutProps?.layout?.id],
  );

  const openSettings = useCallback(
    (layoutId: string, itemId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(appActions.selectionChanged({ layoutId, layoutItemId: itemId }));
    },
    [dispatch],
  );

  const handleSelectWidget = useCallback(
    (item: LayoutItemConstructorProps) => {
      if (!flowLayoutProps?.layout?.id) return;
      addItemToLayout(appConfig, item, flowLayoutProps.layout.id)
        .then((result) => {
          dispatch(appActions.appConfigChanged(result.updatedAppConfig));
          setIsWidgetListOpen(false);
        })
        .catch((err) => {
          console.error("addItemToLayout error", err);
        });
    },
    [appConfig, dispatch, flowLayoutProps?.layout?.id],
  );

  const listItems = useMemo(() => {
    if (!flowLayoutProps?.layout?.content) return null;
    return Object.entries(flowLayoutProps.layout.content)
      .filter(([, item]) => item != null)
      .map(([id, item]) => {
        const label = item.widgetId
          ? (appConfig.widgets?.[item.widgetId]?.label ?? item.widgetId)
          : id;
        return (
          <CalciteListItem
            key={id}
            label={label}
            onClick={(e: React.MouseEvent) => {
              setActiveItemId(id);
              openSettings(flowLayoutProps.layout.id, id, e);
            }}
          >
            <CalciteAction
              slot="actions-end"
              icon="trash"
              text="Remove"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleRemoveWidget(id);
              }}
            />
          </CalciteListItem>
        );
      });
  }, [
    flowLayoutProps?.layout?.content,
    appConfig.widgets,
    flowLayoutProps?.layout?.id,
    openSettings,
    handleRemoveWidget,
  ]);

  if (!flowLayoutProps?.layout?.id) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center">
        No flow layout configured.
      </div>
    );
  }

  return (
    <>
      {isWidgetListOpen && addWidgetButtonRef.current && (
        <WidgetListPopper
          referenceElement={addWidgetButtonRef.current}
          isAccepted={handleIsAccepted}
          onClose={() => setIsWidgetListOpen(false)}
          onSelect={handleSelectWidget}
        ></WidgetListPopper>
      )}
      <div
        className="widget-calcite jimu-widget w-100 h-100"
        style={{ minHeight: 0 }}
      >
        <CalciteFlow
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <CalciteFlowItem
            selected={activeItemId == null}
            heading={"Flow Item - Builder Mode"}
          >
            <CalciteBlock
              heading="Add Widgets"
              open
              description="Widgets will appear below as a list."
            >
              <CalciteButton
                width="full"
                slot="content-start"
                ref={addWidgetButtonRef}
                aria-label="Add widget"
                title="Add widget"
                onClick={() => setIsWidgetListOpen((prev) => !prev)}
              >
                <CalciteIcon icon="plus"></CalciteIcon>
              </CalciteButton>
              <CalciteList>{listItems}</CalciteList>
            </CalciteBlock>
          </CalciteFlowItem>
          <CalciteFlowItem
            selected={activeItemId != null}
            heading={
              activeItemId &&
              flowLayoutProps.layout.content?.[activeItemId]?.widgetId
                ? (appConfig.widgets?.[
                    flowLayoutProps.layout.content[activeItemId].widgetId
                  ]?.label ?? activeItemId)
                : ""
            }
            showBackButton
            onCalciteFlowItemBack={() => setActiveItemId(null)}
          >
            <CalciteBlock
              open
              onClick={(e: React.MouseEvent) =>
                activeItemId &&
                openSettings(flowLayoutProps.layout.id, activeItemId, e)
              }
            >
              {activeWidgetProps && (
                <WidgetRendererInBuilder
                  className="d-flex w-100 h-100"
                  layoutId={flowLayoutProps.layout.id}
                  layoutItemId={activeItemId}
                  {...activeWidgetProps}
                />
              )}
            </CalciteBlock>
          </CalciteFlowItem>
        </CalciteFlow>
      </div>
    </>
  );
}

import {
  React,
  IMSizeModeLayoutJson,
  type LayoutItemConstructorProps,
  IMState,
  ReactRedux,
  appActions,
  LayoutItemType,
} from "jimu-core";
import "calcite-components";
import { type IMConfig } from "../../../config";
import { useMemo, useRef, useState } from "react";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import {
  addItemToLayout,
  WidgetRendererInBuilder,
} from "jimu-layouts/layout-builder";
import { useDispatch, useSelector } from "react-redux";
import { utils } from "jimu-layouts/layout-runtime";
import {
  CalciteBlock,
  CalciteButton,
  CalciteFlow,
  CalciteFlowItem,
  CalciteIcon,
  CalciteList,
  CalciteListItem,
} from "calcite-components";

// type LayoutBuilderProps = {
//   config: IMConfig;
//   mainLayout: IMSizeModeLayoutJson;
//   panelLayout: IMSizeModeLayoutJson;
//   widgetId: string;
//   selectedItemId: string;
// };

export default function Layout(props: any) {
  console.log("Layout Builder Props", props.layouts);
  const [isWidgetListOpen, setIsWidgetListOpen] = useState(false);

  const appConfig = useSelector((state: IMState) => state.appConfig);
  const dispatch = useDispatch();
  const [flowLayoutName] = Object.keys(props.layouts);

  const flowLayout = props.layouts[flowLayoutName];

  const flowLayoutProps = useSelector(
    (state: IMState) =>
      utils.mapStateToLayoutProps(state, { layouts: flowLayout }),
    ReactRedux.shallowEqual,
  );

  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const addWidgetButtonRef = useRef<HTMLCalciteButtonElement>(null);

  const activeWidgetProps = useSelector((state: IMState) => {
    if (!activeItemId || !flowLayoutProps?.layout?.id) return null;

    const layout = state.appConfig.layouts[flowLayoutProps.layout.id];
    const layoutItem = layout?.content?.[activeItemId];
    if (layoutItem?.type === LayoutItemType.Widget) {
      return utils.mapStateToWidgetProps(state, {
        layoutId: flowLayoutProps.layout.id,
        layoutItemId: activeItemId,
      });
    }
    return null;
  }, ReactRedux.shallowEqual);

  const handleIsAccepted = (item: LayoutItemConstructorProps) => {
    return item.itemType === "WIDGET";
  };

  const openSettings = (
    layoutId: string,
    itemId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    dispatch(appActions.selectionChanged({ layoutId, layoutItemId: itemId }));
  };

  const handleSelectWidget = (item: LayoutItemConstructorProps) => {
    addItemToLayout(appConfig, item, flowLayoutProps.layout.id)
      .then((result) => {
        dispatch(appActions.appConfigChanged(result.updatedAppConfig));
        setIsWidgetListOpen(false);
      })
      .catch((err) => {
        console.error("addItemToLayout error", err);
      });
  };

  const listItems = useMemo(() => {
    if (!flowLayoutProps?.layout?.content) return null;
    return Object.entries(flowLayoutProps.layout.content).map(([id, item]) => {
      const label = item.widgetId
        ? (appConfig.widgets?.[item.widgetId]?.label ?? item.widgetId)
        : id;
      console.log("List Item", { id, item, label });
      return (
        <CalciteListItem
          key={id}
          label={label}
          onClick={(e: React.MouseEvent) => {
            setActiveItemId(id);
            openSettings(flowLayoutProps.layout.id, id, e);
          }}
        ></CalciteListItem>
      );
    });
  }, [
    flowLayoutProps.layout.content,
    appConfig.widgets,
    flowLayoutProps.layout.id,
    openSettings,
  ]);

  console.log("Active Widget Props", activeWidgetProps);
  console.log("Flow Layout Props", flowLayoutProps);
  console.log("Active Item ID", activeItemId);

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

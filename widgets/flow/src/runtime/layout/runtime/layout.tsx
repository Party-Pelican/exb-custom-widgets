import { IMState, React, ReactRedux } from "jimu-core";
import { WidgetRenderer, utils } from "jimu-layouts/layout-runtime";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  CalciteBlock,
  CalciteFlow,
  CalciteFlowItem,
  CalciteList,
  CalciteListItem,
} from "calcite-components";

export default function Layout(props: any) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const [flowLayoutName] = Object.keys(props.layouts);
  const flowLayout = props.layouts[flowLayoutName];

  const flowLayoutProps = useSelector(
    (state: IMState) =>
      utils.mapStateToLayoutProps(state, { layouts: flowLayout }),
    ReactRedux.shallowEqual,
  );

  const appConfig = useSelector((state: IMState) => state.appConfig);

  const activeWidgetProps = useSelector((state: IMState) => {
    if (!activeItemId || !flowLayoutProps?.layout?.id) return null;
    const layoutItem =
      state.appConfig.layouts[flowLayoutProps.layout.id]?.content?.[
        activeItemId
      ];
    if (!layoutItem?.widgetId) return null;
    return utils.mapStateToWidgetProps(state, {
      layoutId: flowLayoutProps.layout.id,
      layoutItemId: activeItemId,
    });
  }, ReactRedux.shallowEqual);

  const listItems = useMemo(() => {
    if (!flowLayoutProps?.layout?.content) return null;
    return Object.entries(flowLayoutProps.layout.content).map(([id, item]) => {
      const label = item.widgetId
        ? (appConfig.widgets?.[item.widgetId]?.label ?? item.widgetId)
        : id;
      return (
        <CalciteListItem
          key={id}
          label={label}
          onClick={() => setActiveItemId(id)}
        />
      );
    });
  }, [flowLayoutProps?.layout?.content, appConfig.widgets]);

  const activeLabel = useMemo(() => {
    if (!activeItemId || !flowLayoutProps?.layout?.content?.[activeItemId])
      return "";
    const widgetId = flowLayoutProps.layout.content[activeItemId].widgetId;
    return widgetId ? (appConfig.widgets?.[widgetId]?.label ?? "") : "";
  }, [activeItemId, flowLayoutProps?.layout?.content, appConfig.widgets]);

  return (
    <CalciteFlow style={{ width: "100%", height: "100%" }}>
      <CalciteFlowItem
        selected={activeItemId == null}
        heading={props.config?.listHeading ?? ""}
        description={props.config?.listDescription ?? ""}
      >
        <CalciteBlock open>
          <CalciteList>{listItems}</CalciteList>
        </CalciteBlock>
      </CalciteFlowItem>

      {activeItemId && (
        <CalciteFlowItem
          selected
          heading={activeLabel}
          showBackButton
          onCalciteFlowItemBack={() => setActiveItemId(null)}
        >
          {activeWidgetProps && (
            <WidgetRenderer
              className="d-flex w-100 h-100"
              layoutId={flowLayoutProps.layout.id}
              layoutItemId={activeItemId}
              {...activeWidgetProps}
            />
          )}
        </CalciteFlowItem>
      )}
    </CalciteFlow>
  );
}

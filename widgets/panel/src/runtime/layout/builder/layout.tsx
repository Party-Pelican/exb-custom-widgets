/** @jsx jsx */
import {
  React,
  ReactRedux,
  classNames,
  jsx,
  css,
  polished,
  type LayoutItemConstructorProps,
  getAppStore,
  appActions,
  WidgetProps,
} from "jimu-core";
import { styleUtils, Button } from "jimu-ui";
import {
  utils,
  type LayoutProps,
  type StateToLayoutProps,
} from "jimu-layouts/layout-runtime";
import { getAppConfigAction } from "jimu-for-builder";
import { getTheme2 } from "jimu-theme";
import { PanelLayoutItem } from "./panel-item";
import {
  DropArea,
  CanvasPane,
  addItemToLayout,
  type DropHandlers,
  LIMITED_BOUNDARY_CLASS_NAME,
  LayoutBuilder,
  LayoutItemInBuilder,
  LayoutEntry,
} from "jimu-layouts/layout-builder";
import { ItemTitle } from "../common/item-title";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CalciteAction,
  CalciteActionBar,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "calcite-components";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import { WidgetPlaceholder } from "jimu-ui";

interface State {
  activeItemId: string;
  minimizedList: string[];
  isDragover: boolean;
}

const dropareaStyle = css`
  position: absolute;
  left: 0;
  bottom: 0;
  top: 0;
  right: 0;
  background: transparent;
`;

const guideOverlay = css`
  ${dropareaStyle};
  pointer-events: none;
`;

const minimizedListStyle = css`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: auto;
  display: flex;
  flex-wrap: wrap;

  div.item {
    border-radius: 5px 0;
  }
`;

const Layout: React.FC<LayoutProps & StateToLayoutProps & WidgetProps> = (
  props
) => {
  const { layout, className, style, isPageItem } = props;

  const ref = useRef(null);
  const canvasRef = useRef(null);
  const canvasPane = useRef(null);
  const displayName = "FloatingLayout";
  const refEle = useRef(null);

  const [state, setState] = React.useState({
    activeItemId: "",
    isDragover: false,
    minimizedList: [],
  });

  function handleToggleDragoverEffect(
    value: boolean,
    draggingItem: LayoutItemConstructorProps
  ): void {
    if (draggingItem.layoutInfo?.layoutId === props.layout.id) {
      return;
    }
    canvasPane.current.clear();
    setState((prevState) => ({
      ...prevState,
      isDragover: value,
    }));
  }

  function handleDragOver(
    draggingItem: LayoutItemConstructorProps,
    draggingElement: HTMLElement,
    containerRect: ClientRect,
    itemRect: ClientRect,
    clientX: number,
    clientY: number,
    speed: number
  ): void {
    if (draggingItem.layoutInfo?.layoutId === props.layout.id) {
      return;
    }
    canvasPane.current.clear();
    if (draggingItem.layoutInfo == null) {
      const rect: Partial<ClientRect> = {
        left: itemRect.left,
        top: itemRect.top,
        width: itemRect.width,
        height: itemRect.height,
      };
      canvasPane.current.drawRect(rect);
    }
  }

  function handleDragEnter(draggingItem: LayoutItemConstructorProps): void {
    canvasPane.current.setSize(
      ref.current.clientWidth,
      ref.current.clientHeight
    );
  }

  function handleDragLeave(): void {
    canvasPane.current.clear();
  }

  function handleDrop(
    draggingItem: LayoutItemConstructorProps,
    containerRect: ClientRect,
    itemRect: ClientRect
  ): void {
    canvasPane.current.clear();
    if (draggingItem.layoutInfo?.layoutId === props.layout.id) {
      const { layoutItemId: itemId } = draggingItem.layoutInfo;
      const layoutItem = props.layout.content[itemId];
      if (layoutItem.setting?.docked) {
        const appConfigAction = getAppConfigAction();
        const bbox = layoutItem.bbox;
        appConfigAction
          .editLayoutItemProperty(
            draggingItem.layoutInfo,
            "bbox",
            bbox
              .set("left", `${Math.round(itemRect.left)}px`)
              .set("top", `${Math.round(itemRect.top)}px`)
          )
          .exec();
      }
      return;
    }
    const rect = {
      left: itemRect.left,
      top: itemRect.top,
      width: itemRect.width,
      height: itemRect.height,
      right: containerRect.width - (itemRect.left + itemRect.width),
      bottom: containerRect.height - (itemRect.top + itemRect.height),
    };
    addWidgetToLayout(draggingItem, containerRect, rect as any).catch((err) => {
      console.error(err);
    });
  }

  async function addWidgetToLayout(
    draggingItem: LayoutItemConstructorProps,
    containerRect: ClientRect,
    itemRect: ClientRect
  ): Promise<void> {
    const { layout } = props;
    const result = await addItemToLayout(
      getAppConfigAction().appConfig,
      draggingItem,
      layout.id
    );

    const { layoutInfo, updatedAppConfig } = result;

    getAppConfigAction(updatedAppConfig)
      .editLayoutItemProperty(layoutInfo, "bbox", {
        left: itemRect.left - containerRect.left,
        top: itemRect.top - containerRect.top,
        width: itemRect.width,
        height: itemRect.height,
      })
      .exec();
    getAppStore().dispatch(appActions.selectionChanged(layoutInfo));
  }

  function handleItemClick(itemId: string) {
    if (state.activeItemId !== itemId) {
      setState((prevState) => {
        return { ...prevState, activeItemId: itemId };
      });
    }
    const { layout } = props;
    getAppStore().dispatch(
      appActions.selectionChanged({ layoutId: layout.id, layoutItemId: itemId })
    );
  }

  function handleMinimize(itemId: string) {
    setState((prevState) => {
      return {
        ...prevState,
        minimizedList: [].concat(prevState.minimizedList, itemId),
      };
    });
  }

  function handleMinimizedItemClick(e, itemId: string) {
    e.stopPropagation();
    const idx = state.minimizedList.indexOf(itemId);
    if (idx >= 0) {
      setState((prevState) => {
        return {
          ...prevState,
          minimizedList: prevState.minimizedList.filter(
            (item) => item !== itemId
          ),
        };
      });
    }
  }

  function createItem(layoutItemId: string): JSX.Element {
    const { layout } = props;
    const layoutItem = layout.content[layoutItemId];
    if (!layoutItem) {
      return null;
    }
    return (
      <PanelLayoutItem
        key={`${layout.id}_${layoutItemId}`}
        isActive={layoutItemId === state.activeItemId}
        isMinimized={state.minimizedList.includes(layoutItemId)}
        layoutId={layout.id}
        layoutItemId={layoutItemId}
        onClick={handleItemClick}
        onMinimized={handleMinimize}
      />
    );
  }

  function createMinimizedItem(layoutItemId: string): JSX.Element {
    const { layout } = props;
    return (
      <Button
        className="item"
        key={layoutItemId}
        onClick={(e) => {
          handleMinimizedItemClick(e, layoutItemId);
        }}
      >
        <ItemTitle layoutId={layout.id} layoutItemId={layoutItemId} />
      </Button>
    );
  }

  if (layout == null) {
    return null;
  }

  const content = Object.keys(layout.content).filter((layoutItemId) => {
    const layoutItem = layout.content[layoutItemId];
    return !layoutItem.setting?.docked;
  });

  const mergedClasses = classNames("layout floating-layout", className, {
    [LIMITED_BOUNDARY_CLASS_NAME]: layout.setting?.lockDescendants,
  });

  const mergedStyle = {
    height: "auto",
    position: "relative",
    ...style,
    ...styleUtils.toCSSStyle(layout.setting?.style),
    width: "100%",
    overflow: "hidden",
  };

  const guideVisibleStyle = {
    display: state.isDragover ? "block" : "none",
    zIndex: content.length + 1,
  };

  console.log("Layout", props);

  // useEffect(() => {
  //   const theme = getTheme2();
  //   canvasPane.current = new CanvasPane(canvasRef.current, theme);
  //   canvasPane.current.setColor(
  //     polished.rgba(theme.sys.color.primary.light, 0.2)
  //   );
  // }, []);

  console.log(getAppStore().getState().appConfig);

  return (
    // <div
    //   className={mergedClasses}
    //   ref={(el) => (ref.current = el)}
    //   style={mergedStyle}
    //   data-layoutid={layout.id}
    // >
    //   <DropArea
    //     css={dropareaStyle}
    //     layouts={props.layouts}
    //     highlightDragover={!isPageItem}
    //     onDragEnter={handleDragEnter}
    //     onDragLeave={handleDragLeave}
    //     onDragOver={handleDragOver}
    //     onDrop={handleDrop}
    //     onToggleDragoverEffect={handleToggleDragoverEffect}
    //     isRepeat={props.isRepeat}
    //   />
    //   {(content as any).map((layoutItemId) => createItem(layoutItemId))}
    //   <canvas
    //     css={guideOverlay}
    //     style={guideVisibleStyle}
    //     ref={(el) => (canvasRef.current = el)}
    //   />
    //   <div className="minimized-list" css={minimizedListStyle}>
    //     {state.minimizedList.map((itemId) => createMinimizedItem(itemId))}
    //   </div>
    // </div>

    <div
      // className={mergedClasses}
      ref={(el) => (ref.current = el)}
      // style={mergedStyle}
      data-layoutid={layout.id}
    >
      <CalciteShell ref={refEle}>
        <CalciteShellPanel slot="panel-start" position="start">
          <CalciteActionBar slot="action-bar">
            {/* {Object.keys(props.layout.content).map((layoutItemId) => (
              <CalciteAction>test</CalciteAction>
            ))} */}

            {/* Always show an extra placeholder for adding a new widget */}
            <CalciteAction>
              <WidgetPlaceholder icon={"x"}>
                <WidgetListPopper
                  isPlaceholder
                  referenceElement={refEle.current}
                  onSelect={(e) => console.log(e)}
                  onClose={() => console.log("close")}
                  isAccepted={(item) => item.itemType == "WIDGET"}
                  placement="left"
                />
              </WidgetPlaceholder>
            </CalciteAction>
          </CalciteActionBar>
        </CalciteShellPanel>
      </CalciteShell>
    </div>
  );
};

export default ReactRedux.connect<StateToLayoutProps, unknown, LayoutProps>(
  utils.mapStateToLayoutProps
)(Layout as any);

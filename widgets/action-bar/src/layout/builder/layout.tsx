/** @jsx jsx */
/** @jsxFrag React.Fragment */
import {
  React,
  ReactRedux,
  classNames,
  jsx,
  css,
  LayoutItemConstructorProps,
  polished,
  getAppStore,
  appActions,
} from "jimu-core";
import { styleUtils, Button } from "jimu-ui";
import {
  utils,
  PageContext,
  PageContextProps,
  LayoutProps,
  StateToLayoutProps,
} from "jimu-layouts/layout-runtime";
import { getAppConfigAction } from "jimu-for-builder";
import {
  DropHandlers,
  LIMITED_BOUNDARY_CLASS_NAME,
  DropArea,
  addItemToLayout,
  CanvasPane,
} from "jimu-layouts/layout-builder";
import { useSelector } from "react-redux";
import "./layoutBuilderStyles.css";
import { useEffect } from "react";

interface LayoutBuilderProps
  extends LayoutProps,
    StateToLayoutProps,
    DropHandlers {
  currentlayoutId: string;
}

function Layout(props: LayoutBuilderProps) {
  const appConfig = getAppConfigAction().appConfig;

  const mainSizeMode = useSelector((state: any) => state.mainSizeMode);
  const browserSizeMode = useSelector((state: any) => state.browserSizeMode);
  const layout = useSelector((state: any) => state.layout);
  const state = useSelector((state: any) => state);

  const pageContext = React.useContext(PageContext);
  const dispatch = ReactRedux.useDispatch();

  const content = props.layout.order ?? [];

  useEffect(() => {
    console.log("App Config", appConfig);
    console.log("State", state);
    console.log("Page Context", pageContext);
  });

  function handleDrop(
    draggingItem: LayoutItemConstructorProps,
    containerRect: DOMRect,
    itemRect: DOMRect,
    clientX: number,
    clientY: number
  ) {
    console.group("Handle Drop");
    console.log(draggingItem);
    console.log(containerRect);
    console.log(itemRect);
    console.log(clientX);
    console.log(clientY);
    console.groupEnd();

    const rect = new DOMRect(
      itemRect.x,
      itemRect.y,
      itemRect.width,
      itemRect.height
    );
    addWidgetToLayout(draggingItem, containerRect, rect);
  }

  async function addWidgetToLayout(
    draggingItem: LayoutItemConstructorProps,
    containerRect: DOMRect,
    itemRect: DOMRect
  ) {
    try {
      const result = await addItemToLayout(
        getAppConfigAction().appConfig,
        draggingItem,
        props.layout.id
      );

      const { layoutInfo, updatedAppConfig } = result;

      // dispatch(appActions.layoutChanged(updatedAppConfig, layoutInfo));
    } catch (err) {
      console.error("Something went wrong. ", err);
    }
  }

  function createItem(layoutItemId: string): JSX.Element {
    const { layout } = props;
    const layoutItem = layout.content[layoutItemId];
    if (!layoutItem) {
      return null;
    }

    console.log(layoutItem);
    return <div>{layoutItemId}</div>;
  }

  return (
    <>
      <DropArea
        highlightDragover
        layouts={props.layouts}
        className="placeholder-button"
        onDrop={handleDrop}
      ></DropArea>
      {content.map((i) => createItem(i))}
    </>
  );
}

export default ReactRedux.connect(utils.mapStateToLayoutProps)(Layout);

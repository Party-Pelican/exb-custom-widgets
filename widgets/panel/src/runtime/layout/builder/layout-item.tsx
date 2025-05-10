/** @jsx jsx */
import {
  ReactRedux,
  type IMState,
  jsx,
  LayoutItemType,
  css,
  classNames,
} from "jimu-core";
import {
  type LayoutItemProps,
  utils,
  searchUtils,
} from "jimu-layouts/layout-runtime";
import {
  WidgetRendererInBuilder,
  SectionRendererInBuilder,
  LayoutBuilder,
  LayoutEntry,
} from "jimu-layouts/layout-builder";

export function DockLayoutItem(props: LayoutItemProps) {
  const { layoutId, layoutItemId } = props;
  console.log("DockLayoutItem", props);
  // const widgetProps = ReactRedux.useSelector((state: IMState) => {
  //   const layoutItem = state.appConfig.layouts[layoutId].content[layoutItemId];
  //   if (layoutItem.type === LayoutItemType.Widget) {
  //     console.log("is widget", layoutItem);
  //     return utils.mapStateToWidgetProps(state, { layoutId, layoutItemId });
  //   }
  //   return null;
  // }, ReactRedux.shallowEqual);
  // const sectionProps = ReactRedux.useSelector((state: IMState) => {
  //   const layoutItem = state.appConfig.layouts[layoutId].content[layoutItemId];
  //   if (layoutItem.type === LayoutItemType.Section) {
  //     console.log("is section", layoutItem);
  //     return searchUtils.getSectionInfo(state, layoutItem.sectionId);
  //   }
  //   return null;
  // }, ReactRedux.shallowEqual);

  // const layoutItem = ReactRedux.useSelector((state: IMState) => {
  //   return state.appConfig.layouts[layoutId].content[layoutItemId];
  // }, ReactRedux.shallowEqual);

  return (
    // <div
    //   className={classNames("builder-layout-item d-flex w-100 h-100", {
    //     "is-widget": widgetProps != null,
    //     "is-section": sectionProps != null,
    //   })}
    //   data-layoutitemid={layoutItemId}
    //   data-layoutid={layoutId}
    //   css={css`
    //     background-color: var(--ref-palette-white);
    //   `}
    // >
    //   {widgetProps != null && (
    //     <WidgetRendererInBuilder
    //       layoutId={layoutId}
    //       layoutItemId={layoutItemId}
    //       {...widgetProps}
    //     />
    //   )}
    //   {sectionProps != null && (
    //     <SectionRendererInBuilder
    //       layoutId={layoutId}
    //       layoutItemId={layoutItemId}
    //       {...sectionProps}
    //     />
    //   )}
    // </div>
    <div>
      {/* <LayoutEntry layouts={layoutItem}></LayoutEntry> */}
      <p>Layout Item</p>
    </div>
  );
}

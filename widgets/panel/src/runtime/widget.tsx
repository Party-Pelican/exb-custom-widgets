/** @jsx jsx */
import { React, type AllWidgetProps, jsx } from "jimu-core";
// import Layout from "./layout/runtime/layout";
// import { WidgetPlaceholder } from "jimu-ui";
import { WidgetListPopper } from "jimu-ui/advanced/setting-components";
import { useRef, useState } from "react";

const IconImage = require("./assets/icon.svg");

export default class Widget extends React.PureComponent<
  AllWidgetProps<unknown>
> {
  render(): React.JSX.Element {
    const { layouts, id, builderSupportModules } = this.props;
    const refEle = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    // const LayoutComponent = !window.jimuConfig.isInBuilder
    //   ? Layout
    //   : builderSupportModules.widgetModules.LayoutBuilder;

    // if (LayoutComponent == null) {
    //   return (
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "center",
    //         alignItems: "center",
    //       }}
    //     >
    //       No layout component!
    //     </div>
    //   );
    // }

    // console.log(this.props);
    // const layoutName = Object.keys(layouts)[0];

    return (
      <div className="widget-fixed-layout d-flex w-100 h-100">
        {/* <LayoutComponent
          layouts={layouts[layoutName]}
          isInWidget
          style={{
            overflow: "auto",
            minHeight: "none",
          }}
          layoutItemId={this.props.layoutItemId}
        >
          <WidgetPlaceholder
            icon={IconImage}
            widgetId={id}
            style={{
              border: "none",
            }}
            message="dock layout"
          />
        </LayoutComponent> */}
        <div ref={refEle} onClick={() => setIsOpen(true)}>
          Open Widget Popper
        </div>

        {isOpen && refEle.current && (
          <WidgetListPopper
            referenceElement={refEle.current}
            isPlaceholder={true}
            placement="bottom-start"
            onClose={() => setIsOpen(false)}
            onSelect={(item) => {
              console.log("Widget selected:", item);
            }}
            isAccepted={(item) => item?.itemType === "WIDGET"}
          />
        )}
      </div>
    );
  }
}

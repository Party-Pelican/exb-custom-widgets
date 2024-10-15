import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  return (
    <div className="widget-demo jimu-widget m-2">
      <p>Select Widget</p>
    </div>
  );
};

export default Widget;

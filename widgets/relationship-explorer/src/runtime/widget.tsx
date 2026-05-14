import { Immutable, React, type AllWidgetProps } from "jimu-core";
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";
import { type IMConfig } from "../config";
import { WidgetContextProvider, useWidgetContext } from "./context";
import RenderSourceSelection from "./renderSourceSelection";

function WidgetContent(props: AllWidgetProps<IMConfig>) {
  const { setJimuMapView } = useWidgetContext();

  const sourceDataSource = props.config.sourceData
    ? props.useDataSources?.find(
        (ds) => ds.dataSourceId === props.config.sourceData.dataSourceId,
      )
    : null;

  return (
    <div className="jimu-widget p-3" style={{ backgroundColor: "#fff" }}>
      {props.useMapWidgetIds?.[0] && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={(view: JimuMapView) => setJimuMapView(view)}
        />
      )}
      {sourceDataSource && (
        <RenderSourceSelection
          useDataSource={Immutable.from(sourceDataSource)}
          widgetId={props.id}
        />
      )}
    </div>
  );
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
  return (
    <WidgetContextProvider>
      <WidgetContent {...props} />
    </WidgetContextProvider>
  );
}

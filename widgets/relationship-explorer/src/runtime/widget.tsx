import { useMemo } from "react";
import { Immutable, React, type AllWidgetProps } from "jimu-core";
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";
import { type IMConfig } from "../config";
import { WidgetContextProvider, useWidgetContext } from "./context";
import RenderSourceSelection from "./renderSourceSelection";
import RenderRelatedRecords from "./renderRelatedRecords";

function WidgetContent(props: AllWidgetProps<IMConfig>) {
  const { setJimuMapView, relatedSelections } = useWidgetContext();

  const sourceDataSource = props.config.sourceData
    ? props.useDataSources?.find(
        (ds) => ds.dataSourceId === props.config.sourceData.dataSourceId,
      )
    : null;

  const relatedDataSources = useMemo(
    () => props.config.relationships?.asMutable({ deep: true }),
    [props.config.relationships],
  );

  console.log("Related Selections: ", relatedSelections);
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
      {relatedDataSources && (
        <RenderRelatedRecords
          relationshipDefinitions={relatedDataSources}
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

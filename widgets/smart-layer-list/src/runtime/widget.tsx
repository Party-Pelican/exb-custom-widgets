import { AllWidgetProps, React } from "jimu-core";
import { useEffect, useRef, useState } from "react";
import LayerList from "@arcgis/core/widgets/LayerList.js";
import { IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import useIndexedDB from "../customHooks/useIndexedDB";
import Managedb from "../components/managedb";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const llWidget = useRef(new LayerList(props.config.layerListProps));
  const llWidgetContainer = useRef(null);
  const databaseName = `${props.widgetId}-db`;
  const objectStoreName = `${databaseName}-layers`;
  const { database } = useIndexedDB(databaseName, objectStoreName);
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
  const [ready, setReady] = useState(false);

  const mapViewId = jimuMapView ? jimuMapView.id : null;

  /**
   * Handle changes to the active view.
   * Set the view and container of the layer list widget and update the ready state.
   * Destroy the layer list widget when the widgetId changes.
   */
  function onActiveViewChange(activeView: JimuMapView) {
    setJimuMapView(activeView);
  }

  // Destroy the layer list widget when the widgetId changes
  useEffect(() => {
    return () => {
      // Log the destruction of the layer list widget
      console.log("destroyed layer list widget");
      // Destroy the layer list widget
      llWidget.current.destroy();
    };
  }, [props.widgetId]);

  useEffect(() => {
    if (jimuMapView) {
      llWidget.current.visibleElements =
        props.config.layerListProps.visibleElements;
      llWidget.current.dragEnabled = props.config.layerListProps.dragEnabled;
      // Set the view of the layer list widget
      llWidget.current.view = jimuMapView.view;
      // Set the container of the layer list widget
      llWidget.current.container = llWidgetContainer.current;
      setReady(true);
    } else {
      // Clear the view of the layer list widget
      llWidget.current.view = null;
      setReady(false);
    }
  }, [
    mapViewId,
    props.config.layerListProps.dragEnabled,
    ...Object.values(props.config.layerListProps.visibleElements),
  ]);

  return (
    <>
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />
      <div className="w-100 h-100 d-flex flex-column overflow-auto">
        {!jimuMapView && (
          <div>
            Select a map in the settings to display the smart layer list.
          </div>
        )}
        {database && ready && (
          <Managedb
            database={database}
            objectStoreName={objectStoreName}
            llWidget={llWidget.current}
            saveColor={props.config.saveColor}
            resetColor={props.config.resetColor}
            textColor={props.config.textColor}
          />
        )}
        <div
          id="smart-layer-list"
          ref={llWidgetContainer}
          className="flex-grow-1"
        ></div>
      </div>
    </>
  );
}

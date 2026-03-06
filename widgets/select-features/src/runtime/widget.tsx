import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useEffect, useRef, useState } from "react";
import Handles from "@arcgis/core/core/Handles.js";
import PopupComponent from "../components/popup";
import Graphic from "@arcgis/core/Graphic";
import SelectionManager from "../components/selectionManager";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Graphic[]>([]);
  const mapHandlers = useRef(new Handles());
  const popupTemplates = useRef<Map<string, __esri.PopupTemplate | null>>(
    new Map(),
  );

  function onActiveViewChange(jimuMapView: JimuMapView) {
    setJimuMapView(jimuMapView);
  }

  useEffect(() => {
    return () => {
      mapHandlers.current.removeAll();
    };
  }, []);

  return (
    <>
      {jimuMapView && (
        <SelectionManager
          jimuMapView={jimuMapView}
          handles={mapHandlers.current}
          setSelectedFeatures={setSelectedFeatures}
          popupTemplates={popupTemplates.current}
        ></SelectionManager>
      )}

      {props.useMapWidgetIds && props.useMapWidgetIds[0]
        ? null
        : "No map widget"}
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />

      {selectedFeatures.length > 0 && jimuMapView && (
        <PopupComponent features={selectedFeatures} view={jimuMapView.view} />
      )}
    </>
  );
};

export default Widget;

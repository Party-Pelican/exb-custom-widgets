import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useEffect, useRef, useState } from "react";
import Handles from "@arcgis/core/core/Handles.js";
import PopupComponent from "../components/popup";
import { selectByGraphic } from "../utils/handlers";
import Graphic from "@arcgis/core/Graphic";
import SelectionManager from "../components/selectionManager";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Graphic[]>([]);
  const mapHandlers = useRef(new Handles());
  const popupTemplates = useRef(new Map());

  function onActiveViewChange(jimuMapView: JimuMapView) {
    jimuMapView.whenAllJimuLayerViewLoaded().then((results) => {
      console.log(results);
    });
    setJimuMapView(jimuMapView);
  }

  useEffect(() => {
    if (jimuMapView) {
      if (!mapHandlers.current.has("clickHandler")) {
        const clickHandler = jimuMapView.view.on("click", (event) => {
          selectByGraphic(
            event,
            setSelectedFeatures,
            jimuMapView,
            popupTemplates.current
          );
        });

        mapHandlers.current.add(clickHandler, "clickHandler");
      }
    }
    return () => {
      mapHandlers.current.removeAll();
    };
  }, [jimuMapView]);

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
        <PopupComponent
          features={selectedFeatures}
          view={jimuMapView.view}
          jimuMapView={jimuMapView}
        />
      )}
    </>
  );
};

export default Widget;

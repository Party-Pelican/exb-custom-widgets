import { QueriableDataSource, React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useEffect, useRef, useState } from "react";
import Handles from "@arcgis/core/core/Handles.js";
import PopupComponent from "../components/popup";
import { changeSelectionMode, selectByGraphic } from "../utils/handlers";
import Graphic from "@arcgis/core/Graphic";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import { ButtonGroup, Button, Icon } from "jimu-ui";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Graphic[]>([]);
  const mapHandlers = useRef(new Handles());
  const popupTemplates = useRef(new Map());
  const sketchViewModel = useRef(
    new SketchViewModel({
      layer: new GraphicsLayer({ listMode: "hide", title: "Sketch Selection" }),
      polygonSymbol: {
        type: "simple-fill",
        color: [150, 150, 150, 0.2],
        outline: {
          color: [50, 50, 50],
          width: 2,
        },
      },
      polylineSymbol: {
        type: "simple-line",
        color: [130, 130, 130],
        width: 2,
      },
    })
  );

  if (selectedFeatures.length > 0) {
    console.log(selectedFeatures);
  }

  function onActiveViewChange(jimuMapView: JimuMapView) {
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

        const sketchSelectHandler = sketchViewModel.current.on(
          "create",
          (event) => {
            if (event.state === "complete") {
              console.log("sketch complete");
            }
          }
        );

        mapHandlers.current.add(clickHandler, "clickHandler");
        mapHandlers.current.add(sketchSelectHandler, "sketchSelectHandler");
      }
      sketchViewModel.current.view = jimuMapView.view;
    }
    return () => {
      mapHandlers.current.removeAll();
      sketchViewModel.current.view = null;
    };
  }, [jimuMapView]);

  return (
    <div className="w-100 h-100 overflow-auto">
      {props.useMapWidgetIds && props.useMapWidgetIds[0]
        ? null
        : "No map widget"}
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />

      <ButtonGroup>
        <Button
          active
          onClick={() => {
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
          }}
        >
          Click
        </Button>
        <Button
          onClick={() => {
            changeSelectionMode(
              sketchViewModel.current,
              mapHandlers.current,
              "polyline"
            );
          }}
        >
          Polyline
        </Button>
        <Button
          onClick={() =>
            changeSelectionMode(
              sketchViewModel.current,
              mapHandlers.current,
              "polygon"
            )
          }
        >
          Polygon
        </Button>
      </ButtonGroup>
      {selectedFeatures.length > 0 && jimuMapView && (
        <PopupComponent
          features={selectedFeatures}
          view={jimuMapView.view}
          jimuMapView={jimuMapView}
        />
      )}
    </div>
  );
};

export default Widget;

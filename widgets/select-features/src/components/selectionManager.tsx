import { useEffect, useRef } from "react";
import { JimuMapView } from "jimu-arcgis";
import SketchViewModel from "esri/widgets/Sketch/SketchViewModel";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import { changeSelectionMode, selectByGraphic } from "../utils/handlers";
import { useSelector } from "react-redux";
import { IMState } from "jimu-core";

export default function SelectionManager({
  jimuMapView,
  handles,
  setSelectedFeatures,
  popupTemplates,
}: {
  jimuMapView: JimuMapView;
  handles: __esri.Handles;
  setSelectedFeatures: (selectedFeatures: __esri.Graphic[]) => void;
  popupTemplates: Map<string, __esri.PopupTemplate>;
}) {
  const selectionMode = useSelector(
    (state: IMState) => state.selectModeState?.mode
  );

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

  useEffect(() => {
    sketchViewModel.current.view = jimuMapView.view;
    const sketchHandler = sketchViewModel.current.on("create", (event) => {
      if (event.state === "complete") {
        selectByGraphic(
          event.graphic,
          setSelectedFeatures,
          jimuMapView,
          popupTemplates
        );
      }
    });

    handles.add(sketchHandler, "sketchHandler");
    return () => {
      sketchViewModel.current.view = null;
      handles.remove("sketchHandler");
    };
  }, [jimuMapView.view]);

  useEffect(() => {
    console.log("IN SELECTION MANAGER", selectionMode);
    if (selectionMode === "click") {
      sketchViewModel.current.cancel();
      if (!handles.has("clickHandler")) {
        const clickHandler = jimuMapView.view.on("click", (event) => {
          selectByGraphic(
            event,
            setSelectedFeatures,
            jimuMapView,
            popupTemplates
          );
        });

        handles.add(clickHandler, "clickHandler");
      }
    } else if (selectionMode === "polyline") {
      changeSelectionMode(sketchViewModel.current, handles, "polyline");
    } else if (selectionMode === "polygon") {
      changeSelectionMode(sketchViewModel.current, handles, "polygon");
    }
  }, [selectionMode]);

  return null;
}

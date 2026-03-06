import Features from "@arcgis/core/widgets/Features.js";
import { useEffect, useRef } from "react";
import { React } from "jimu-core";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import { bufferFromFeature } from "../utils/handlers";
import { bufferFromFeatureAction } from "../utils/actions";

export default function PopupComponent({
  features,
  view,
}: {
  features: __esri.Graphic[];
  view: __esri.MapView | __esri.SceneView;
}) {
  const popup = useRef(
    new Features({
      view,
      map: view.map,
      viewModel: {
        actions: [bufferFromFeatureAction],
      },
    }),
  );

  const flashGraphicsLayer = useRef(new GraphicsLayer({ listMode: "hide" }));
  const selectedFeatureWatch = useRef<__esri.WatchHandle>(null);
  const actionHandle = useRef<__esri.WatchHandle>(null);

  const domElement = useRef(null);

  useEffect(() => {
    popup.current.container = domElement.current;
    view.map.add(flashGraphicsLayer.current);

    selectedFeatureWatch.current = reactiveUtils.watch(
      () => popup.current.selectedFeature,
      (selectedFeature) => {
        flashGraphicsLayer.current.graphics.removeAll();
        if (!selectedFeature) {
          return;
        }

        const selectedGraphic = selectedFeature.clone();
        if (selectedGraphic.geometry.type === "point") {
          selectedGraphic.symbol = new SimpleMarkerSymbol({
            outline: {
              color: "#ff0000",
              width: 2,
            },
          });
        } else if (selectedGraphic.geometry.type === "polyline") {
          selectedGraphic.symbol = new SimpleLineSymbol({
            color: "#ff0000",
            width: 2,
          });
        } else if (selectedGraphic.geometry.type === "polygon") {
          selectedGraphic.symbol = new SimpleFillSymbol({
            outline: {
              color: "#ff0000",
              width: 2,
            },
          });
        }
        flashGraphicsLayer.current.graphics.add(selectedGraphic);
      },
    );

    actionHandle.current = reactiveUtils.on(
      () => popup.current.viewModel,
      "trigger-action",
      (event) => {
        if (!popup.current.selectedFeature) {
          return;
        }

        if (event.action.id === "buffer-this") {
          bufferFromFeature(
            popup.current.selectedFeature,
            flashGraphicsLayer.current,
          );
        } else if (event.action.id === "zoom-to-feature") {
          view.goTo(popup.current.selectedFeature);
        }
      },
    );

    return () => {
      selectedFeatureWatch.current?.remove();
      actionHandle.current?.remove();
      flashGraphicsLayer.current.graphics.removeAll();
      view.map.remove(flashGraphicsLayer.current);
      popup.current.container = null;
    };
  }, [view]);

  useEffect(() => {
    popup.current.open({
      features: features,
    });
  }, [features]);

  return <div ref={domElement} className="flex-grow-1 overflow-auto"></div>;
}

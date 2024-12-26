import { DataSourceSelectionMode } from "jimu-core";
import Graphic from "@arcgis/core/Graphic";
import { JimuLayerView, JimuMapView } from "jimu-arcgis";
import Collection from "esri/core/Collection";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";

function extractPopupTemplate(
  layer: __esri.Layer
): __esri.Collection<__esri.PopupTemplate> {
  switch (layer.type) {
    case "map-image":
      const mapImageLayer = layer as __esri.MapImageLayer;
      return mapImageLayer.sublayers.map((sublayer) => sublayer.popupTemplate);
    case "feature":
      const featureLayer = layer as __esri.FeatureLayer;
      const collection = new Collection<__esri.PopupTemplate>();
      collection.add(featureLayer.popupTemplate);
      return collection;
    default:
      return new Collection<__esri.PopupTemplate>();
  }
}

function checkPopupEnabled(layer: __esri.Layer): boolean {
  switch (layer.type) {
    case "map-image":
      const mapImageLayer = layer as __esri.MapImageLayer;
      return mapImageLayer.sublayers.some((sublayer) => sublayer.popupEnabled);
    case "feature":
      const featureLayer = layer as __esri.FeatureLayer;
      return featureLayer.popupEnabled;
    default:
      return false;
  }
}

async function selectByGraphic(
  event: __esri.ViewClickEvent,
  setSelectedFeatures: (selectedFeatures: Graphic[]) => void,
  jimuMapView: JimuMapView,
  popupTemplates: Map<string, __esri.PopupTemplate>
) {
  setSelectedFeatures([]);
  jimuMapView.clearSelectedFeatures();
  const graphic = new Graphic({
    geometry: event.mapPoint,
  });

  const selectedFeatures = await jimuMapView.selectFeaturesByGraphic(
    graphic,
    "intersects",
    DataSourceSelectionMode.New,
    {
      returnAllFields: true,
      returnFullGeometry: true,
      filterJimuLayerView: (jimuLayerView: JimuLayerView) => {
        return (
          jimuLayerView.view &&
          "visible" in jimuLayerView.view &&
          jimuLayerView.view.visible &&
          checkPopupEnabled(jimuLayerView.view.layer)
        );
      },
    }
  );

  for (const dataSourceId in selectedFeatures) {
    if (selectedFeatures[dataSourceId].length > 0) {
      if (!popupTemplates.has(dataSourceId)) {
        const popupTemplate = extractPopupTemplate(
          (selectedFeatures[dataSourceId][0] as Graphic).layer
        );
        console.log("popupTemplate", popupTemplate.at(0));
        popupTemplates.set(dataSourceId, popupTemplate.at(0));
        selectedFeatures[dataSourceId].forEach(
          (f: Graphic) => (f.popupTemplate = popupTemplate.at(0))
        );
        // @ts-ignore
        setSelectedFeatures((prevState: Graphic[]) => {
          return [...prevState, ...selectedFeatures[dataSourceId]];
        });
      } else {
        const popupTemplate = popupTemplates.get(dataSourceId);
        console.log("popupTemplate from cache", popupTemplate);
        selectedFeatures[dataSourceId].forEach(
          (f: Graphic) => (f.popupTemplate = popupTemplate)
        );
        // @ts-ignore
        setSelectedFeatures((prevState: Graphic[]) => {
          return [...prevState, ...selectedFeatures[dataSourceId]];
        });
      }
    }
  }
}

function bufferFromFeature(
  feature: __esri.Graphic,
  graphicLayer: __esri.GraphicsLayer
) {
  const buffGeom = geometryEngine.buffer(feature.geometry, 50, "feet");
  const buffgra = new Graphic({
    // @ts-ignore
    geometry: buffGeom,
    symbol: {
      // @ts-ignore
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: null, // No fill
      style: "none", // Explicitly specify no fill style
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: [0, 0, 255, 1], // Bright blue outline
        width: 2, // Adjust width as desired
      },
    },
  });
  graphicLayer.removeAll();
  graphicLayer.add(buffgra);
}

function changeSelectionMode(
  sketchVM: __esri.SketchViewModel,
  viewHandles: __esri.Handles,
  sketchType: "polygon" | "polyline"
) {
  viewHandles.remove("clickHandler");
  sketchVM.create(sketchType, { mode: "click" });
}

export { selectByGraphic, bufferFromFeature, changeSelectionMode };

import { DataSourceSelectionMode } from "jimu-core";
import Graphic from "@arcgis/core/Graphic";
import { JimuLayerView, JimuMapView } from "jimu-arcgis";
import Collection from "esri/core/Collection";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import type { Dispatch, SetStateAction } from "react";

function extractPopupTemplate(
  layer:
    | __esri.Layer
    | __esri.Sublayer
    | __esri.SubtypeSublayer
    | __esri.BuildingComponentSublayer,
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

function resolvePopupTemplate(feature: Graphic): __esri.PopupTemplate | null {
  if (feature.popupTemplate) {
    return feature.popupTemplate;
  }

  const popupTemplateCollection = extractPopupTemplate(feature.layer);
  return popupTemplateCollection.find((template) => !!template) ?? null;
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
  event: __esri.ViewClickEvent | Graphic,
  setSelectedFeatures: Dispatch<SetStateAction<Graphic[]>>,
  jimuMapView: JimuMapView,
  popupTemplates: Map<string, __esri.PopupTemplate | null>,
) {
  setSelectedFeatures([]);
  jimuMapView.clearSelectedFeatures();
  let graphic = new Graphic();

  if (event instanceof Graphic) {
    graphic = event;
  } else {
    graphic.geometry = event.mapPoint;
  }

  try {
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
      },
    );

    const mergedFeatures: Graphic[] = [];
    for (const dataSourceId in selectedFeatures) {
      const dataSourceFeatures = selectedFeatures[dataSourceId] as Graphic[];

      if (dataSourceFeatures.length > 0) {
        if (!popupTemplates.has(dataSourceId)) {
          popupTemplates.set(
            dataSourceId,
            resolvePopupTemplate(dataSourceFeatures[0]),
          );
        }

        const popupTemplate = popupTemplates.get(dataSourceId);
        if (popupTemplate) {
          dataSourceFeatures.forEach(
            (f: Graphic) => (f.popupTemplate = popupTemplate),
          );
        }

        mergedFeatures.push(...dataSourceFeatures);
      }
    }

    setSelectedFeatures(mergedFeatures);
  } catch {
    setSelectedFeatures([]);
  }
}

function bufferFromFeature(
  feature: __esri.Graphic,
  graphicLayer: __esri.GraphicsLayer,
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
  sketchType: "polygon" | "polyline",
) {
  viewHandles.remove("clickHandler");
  sketchVM.cancel();
  sketchVM.create(sketchType, { mode: "click" });
}

export { selectByGraphic, bufferFromFeature, changeSelectionMode };

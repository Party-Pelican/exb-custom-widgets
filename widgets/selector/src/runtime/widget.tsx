import { React, AllWidgetProps, DataSourceSelectionMode } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useEffect, useState, useCallback } from "react";
import Graphic from "esri/Graphic";
import { Extent, Point } from "esri/geometry";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

const envelopeOutlineSymbol = {
  type: "simple-fill", // autocasts as SimpleFillSymbol
  color: [0, 0, 0, 0], // Transparent fill
  style: "none",
  outline: {
    color: "red",
    width: 1,
  },
};

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]); // You can type this more specifically if needed

  const handleActiveViewChange = useCallback((view: JimuMapView) => {
    if (view) setJimuMapView(view);
  }, []);

  const createSelectionEnvelope = (
    mapPoint: Point,
    toleranceMeters: number
  ) => {
    return new Extent({
      xmin: mapPoint.x - toleranceMeters,
      ymin: mapPoint.y - toleranceMeters,
      xmax: mapPoint.x + toleranceMeters,
      ymax: mapPoint.y + toleranceMeters,
      spatialReference: mapPoint.spatialReference,
    });
  };

  const handleClick = useCallback(
    async (e: __esri.ViewClickEvent) => {
      if (!jimuMapView) return;

      const mapPoint = e.mapPoint;
      const tolerance = 7 * jimuMapView.view.resolution; // Approx. default click tolerance
      const envelope = createSelectionEnvelope(mapPoint, tolerance);

      const envelopeGraphic = new Graphic({
        geometry: envelope,
        symbol: envelopeOutlineSymbol,
      });

      jimuMapView.view.graphics.removeAll();
      jimuMapView.view.graphics.add(envelopeGraphic);

      try {
        const selectionResult = await jimuMapView.selectFeaturesByGraphic(
          envelopeGraphic,
          "esriSpatialRelEnvelopeIntersects",
          DataSourceSelectionMode.New
        );

        await jimuMapView.whenAllJimuLayerViewLoaded();
        const layerViews = jimuMapView.getAllJimuLayerViews();
        const dataSources = layerViews.map((lv) => lv.getLayerDataSource());
        dataSources.forEach((ds) => {
          console.log("Derived Data Source:", ds.getAllDerivedDataSources());
        });

        const recordsByLayer = dataSources.map((ds) => ({
          dataSource: ds,
          records: ds.getSelectedRecords(),
        }));

        setSelectedRecords(recordsByLayer);

        console.group("Feature Selection");
        recordsByLayer.forEach(({ dataSource, records }, i) => {
          console.log(`Data Source ${i + 1}:`, dataSource);
          console.log(`Records:`, records);
          if (records.length > 0) {
            console.log("First Record Data:", records[0].getData());
            console.log("First Record Geometry:", records[0].getGeometry());
          }
        });
        console.groupEnd();
      } catch (err) {
        console.error("Feature selection failed", err);
      }
    },
    [jimuMapView]
  );

  useEffect(() => {
    if (!jimuMapView) return;

    const handle = reactiveUtils.on(
      () => jimuMapView.view,
      "click",
      handleClick
    );

    return () => handle.remove();
  }, [jimuMapView, handleClick]);

  return (
    <JimuMapViewComponent
      useMapWidgetId={props.useMapWidgetIds?.[0]}
      onActiveViewChange={handleActiveViewChange}
    />
  );
}

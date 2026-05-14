import {
  DataSource,
  DataSourceComponent,
  FeatureDataRecord,
  React,
  type IMUseDataSource,
  type ImmutableArray,
} from "jimu-core";
import { useEffect, useRef } from "react";
import { useWidgetContext } from "./context";
import { ArcgisFeatures } from "@arcgis/map-components-react";

type RenderSourceSelectionProps = {
  useDataSource: IMUseDataSource;
  widgetId: string;
};

export default function RenderSourceSelection({
  useDataSource,
  widgetId,
}: RenderSourceSelectionProps) {
  const {
    setSelectedDataRecords,
    clearResults,
    selectedDataRecords,
    jimuMapView,
  } = useWidgetContext();
  const dsRef = useRef<DataSource>(null);
  const featuresRef = useRef<HTMLArcgisFeaturesElement>(null);

  useEffect(() => {
    if (!featuresRef.current || !jimuMapView?.view) return;
    if (selectedDataRecords.length === 0) {
      featuresRef.current.clear();
      return;
    }
    console.log(featuresRef.current.map);
    featuresRef.current.open({
      features: selectedDataRecords.map(
        (r) =>
          (r as unknown as FeatureDataRecord).getFeature() as __esri.Graphic,
      ),
    });
  }, [selectedDataRecords, jimuMapView]);

  function handleSelectionChange(_ids: ImmutableArray<string>) {
    if (!dsRef.current) return;
    const selected = dsRef.current.getSelectedRecords();
    setSelectedDataRecords(selected);
    clearResults();
  }

  return (
    <>
      <DataSourceComponent
        useDataSource={useDataSource}
        widgetId={widgetId}
        onDataSourceCreated={(ds) => {
          dsRef.current = ds;
        }}
        onSelectionChange={handleSelectionChange}
      />
      {jimuMapView?.view && jimuMapView.view.map && (
        <ArcgisFeatures
          hideCloseButton
          map={jimuMapView.view.map}
          ref={featuresRef}
        />
      )}
    </>
  );
}

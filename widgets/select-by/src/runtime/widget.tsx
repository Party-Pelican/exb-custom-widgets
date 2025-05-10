import {
  DataSourceTypes,
  FeatureLayerDataSource,
  React,
  type AllWidgetProps,
} from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useRef, useState } from "react";
import { Button, FloatingPanel } from "jimu-ui";
import AttributeForm from "../components/attributeForm/attributeForm";
import LocationForm from "../components/locationForm/locationForm";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [selectionType, setSelectionType] = useState<
    "attributes" | "location" | null
  >(null);
  const [featureLayerDataSources, setFeatureLayerDataSources] =
    useState<FeatureLayerDataSource[]>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const floatingPanelRef = useRef(null);

  function onActiveViewChange(activeView: JimuMapView) {
    if (activeView) {
      activeView.whenJimuMapViewLoaded().then((jimuMapView) => {
        const mapDataSource = jimuMapView.getMapDataSource();

        mapDataSource.childDataSourcesReady().then(() => {
          const flds = mapDataSource.getDataSourcesByType(
            DataSourceTypes.FeatureLayer
          ) as FeatureLayerDataSource[];

          setFeatureLayerDataSources(flds);
        });
      });
    }
  }

  return (
    <div
      className="w-100 h-100 d-flex flex-column flex-md-row flex-wrap overflow-auto"
      ref={floatingPanelRef}
    >
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />

      <Button
        disabled={!featureLayerDataSources}
        className="btn flex-fill m-1 py-1"
        onClick={() => {
          setSelectionType("attributes");
          setDialogVisible(true);
        }}
      >
        Select by Attributes
      </Button>
      <Button
        disabled={!featureLayerDataSources}
        className="btn flex-fill m-1 py-1"
        onClick={() => {
          setSelectionType("location");
          setDialogVisible(true);
        }}
      >
        Select by Location
      </Button>

      {dialogVisible && (
        <FloatingPanel
          showHeaderCollapse
          autoSize
          headerTitle={`Select by ${
            selectionType?.charAt(0).toUpperCase() + selectionType?.slice(1)
          }`}
          role="dialog"
          toggle={() => {
            setDialogVisible(false);
            setSelectionType(null);
          }}
          open={dialogVisible}
          reference={floatingPanelRef.current}
        >
          {selectionType === "attributes" ? (
            <AttributeForm
              featureLayerDataSources={featureLayerDataSources}
              widgetId={props.widgetId}
              toggleDialog={() => {
                setDialogVisible(false);
                setSelectionType(null);
              }}
            />
          ) : (
            <LocationForm
              widgetId={props.widgetId}
              featureLayerDataSources={featureLayerDataSources}
              toggleDialog={() => {
                setDialogVisible(false);
                setSelectionType(null);
              }}
            ></LocationForm>
          )}
        </FloatingPanel>
      )}
    </div>
  );
};

export default Widget;

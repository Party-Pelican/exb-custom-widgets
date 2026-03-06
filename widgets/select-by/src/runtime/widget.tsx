import {
  DataSourceTypes,
  FeatureLayerDataSource,
  React,
  type AllWidgetProps,
} from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { useRef, useState } from "react";
import {
  Button,
  FloatingPanel,
  type FlipOptions,
  type ShiftOptions,
} from "jimu-ui";
import AttributeForm from "../components/attributeForm/attributeForm";
import LocationForm from "../components/locationForm/locationForm";

const panelShiftOptions: ShiftOptions = {
  rootBoundary: "viewport",
  padding: 8,
};

const panelFlipOptions: FlipOptions = {
  fallbackPlacements: ["top-start", "bottom-end", "top-end"],
};

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [selectionType, setSelectionType] = useState<
    "attributes" | "location" | null
  >(null);
  const [featureLayerDataSources, setFeatureLayerDataSources] =
    useState<FeatureLayerDataSource[]>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [panelReference, setPanelReference] = useState<HTMLElement>(null);
  const attributesButtonRef = useRef<HTMLButtonElement>(null);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const hasFeatureLayers = (featureLayerDataSources?.length ?? 0) > 0;

  function closeDialog() {
    setDialogVisible(false);
    setSelectionType(null);
    setPanelReference(null);
  }

  function onActiveViewChange(activeView: JimuMapView) {
    if (activeView) {
      activeView.whenJimuMapViewLoaded().then((jimuMapView) => {
        const mapDataSource = jimuMapView.getMapDataSource();

        mapDataSource.childDataSourcesReady().then(() => {
          const flds = mapDataSource.getDataSourcesByType(
            DataSourceTypes.FeatureLayer,
          ) as FeatureLayerDataSource[];

          setFeatureLayerDataSources(flds);
        });
      });
    }
  }

  return (
    <div className="w-100 h-100 d-flex flex-column flex-md-row flex-wrap overflow-auto">
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />

      <div className="w-100 d-flex flex-column flex-md-row flex-wrap">
        <Button
          ref={attributesButtonRef}
          disabled={!hasFeatureLayers}
          className="btn flex-fill m-1 py-1"
          onClick={() => {
            setSelectionType("attributes");
            setPanelReference(attributesButtonRef.current);
            setDialogVisible(true);
          }}
        >
          Select by Attributes
        </Button>
        <Button
          ref={locationButtonRef}
          disabled={!hasFeatureLayers}
          className="btn flex-fill m-1 py-1"
          onClick={() => {
            setSelectionType("location");
            setPanelReference(locationButtonRef.current);
            setDialogVisible(true);
          }}
        >
          Select by Location
        </Button>
      </div>

      {dialogVisible && (
        <FloatingPanel
          showHeaderCollapse
          autoSize
          headerTitle={`Select by ${
            selectionType?.charAt(0).toUpperCase() + selectionType?.slice(1)
          }`}
          role="dialog"
          toggle={(event, type) => {
            if (type === "clickOutside") {
              return;
            }

            closeDialog();
          }}
          open={dialogVisible}
          placement="bottom-start"
          shiftOptions={panelShiftOptions}
          flipOptions={panelFlipOptions}
          reference={panelReference}
        >
          {selectionType === "attributes" ? (
            <AttributeForm
              featureLayerDataSources={featureLayerDataSources}
              widgetId={props.widgetId}
              toggleDialog={closeDialog}
            />
          ) : (
            <LocationForm
              widgetId={props.widgetId}
              featureLayerDataSources={featureLayerDataSources}
              toggleDialog={closeDialog}
            ></LocationForm>
          )}
        </FloatingPanel>
      )}
    </div>
  );
};

export default Widget;

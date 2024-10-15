import { DataSourceManager, React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuLayerView, JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { MouseEvent, useState } from "react";
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from "jimu-ui";
import ConditionController from "./conditionController";
import { type IMUseDataSource } from "jimu-core";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [activeView, setActiveView] = useState<JimuMapView>(null);
  const [jimuLayerViews, setJimuLayerViews] = useState<JimuLayerView[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState({
    dataSource: null,
    schema: null,
  });

  function onActiveViewChange(activeView: JimuMapView) {
    if (activeView) {
      setActiveView(activeView);
      activeView.whenAllJimuLayerViewLoaded().then((jimuLayerViews) => {
        setJimuLayerViews(Object.values(jimuLayerViews));
      });
    } else {
      setActiveView(null);
      setJimuLayerViews([]);
    }
  }

  function handleDataSourceSelection(mouseEvent: MouseEvent<any, MouseEvent>) {
    DataSourceManager.getInstance()
      .createDataSourceByUseDataSource({
        dataSourceId: (mouseEvent.target as HTMLInputElement).value,
        mainDataSourceId: (mouseEvent.target as HTMLInputElement).value,
        rootDataSourceId: activeView.dataSourceId,
      } as IMUseDataSource)
      .then((dataSource) => {
        setSelectedDataSource({
          dataSource: dataSource,
          schema: dataSource.getSchema(),
        });
      });
  }

  return (
    <div className="m-2">
      <p>QueryBuilder Widget</p>

      {activeView && jimuLayerViews.length > 0 && (
        <Dropdown activeIcon menuItemCheckMode="singleCheck" menuRole="listbox">
          <DropdownButton>
            {selectedDataSource.schema?.label || "Select a Datasource"}
          </DropdownButton>
          <DropdownMenu>
            {jimuLayerViews.map((jimuLayerView) => {
              return (
                <DropdownItem
                  active={
                    jimuLayerView.layerDataSourceId ===
                    selectedDataSource.dataSource?.id
                  }
                  value={jimuLayerView.layerDataSourceId}
                  key={jimuLayerView.layerDataSourceId}
                  onClick={handleDataSourceSelection}
                >
                  {jimuLayerView.layer.title}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </Dropdown>
      )}
      {selectedDataSource.schema && selectedDataSource.schema.fields && (
        <ConditionController
          fields={Object.keys(selectedDataSource.schema.fields).map(
            (k) => selectedDataSource.schema.fields[k]
          )}
          key={selectedDataSource.dataSource?.id}
          selectedDataSource={selectedDataSource.dataSource}
          widgetId={props.widgetId}
        />
      )}
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />
    </div>
  );
};

export default Widget;

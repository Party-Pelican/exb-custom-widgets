import {
  DataSource,
  DataSourceManager,
  React,
  type AllWidgetProps,
} from "jimu-core";
import { type IMConfig } from "../config";
import {
  JimuLayerView,
  JimuMapView,
  JimuMapViewComponent,
  WebMapDataSource,
} from "jimu-arcgis";
import { MouseEvent, useState } from "react";
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from "jimu-ui";
import ConditionController from "./conditionController";
import { type IMUseDataSource } from "jimu-core";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState({
    dataSource: null,
    schema: null,
  });

  function onActiveViewChange(activeView: JimuMapView) {
    if (activeView) {
      activeView.whenAllJimuLayerViewLoaded().then((jimuLayerViews) => {
        const layerDataSourcePromises = Object.values(jimuLayerViews).map(
          (jimuLayerView) =>
            DataSourceManager.getInstance().createDataSourceByUseDataSource({
              dataSourceId: jimuLayerView.layerDataSourceId,
              mainDataSourceId: jimuLayerView.layerDataSourceId,
              rootDataSourceId: activeView.dataSourceId,
            } as IMUseDataSource)
        );

        Promise.all(layerDataSourcePromises).then((dataSources) => {
          setDataSources(dataSources);
        });
      });
    } else {
      setDataSources([]);
    }
  }

  function handleDataSourceSelection(mouseEvent: MouseEvent<any, MouseEvent>) {
    const ds = dataSources.find(
      (ds) => ds.id === (mouseEvent.target as HTMLInputElement).value
    );

    setSelectedDataSource({ dataSource: ds, schema: ds.getSchema() });
  }

  return (
    <div className="m-2">
      <p>QueryBuilder Widget</p>

      {dataSources.length > 0 && (
        <Dropdown activeIcon menuItemCheckMode="singleCheck" menuRole="listbox">
          <DropdownButton>
            {selectedDataSource.schema?.label || "Select a Datasource"}
          </DropdownButton>
          <DropdownMenu>
            {dataSources.length > 0 &&
              dataSources.map((dataSource) => {
                return (
                  <DropdownItem
                    active={dataSource.id === selectedDataSource.dataSource?.id}
                    value={dataSource.id}
                    key={dataSource.id}
                    onClick={handleDataSourceSelection}
                  >
                    {dataSource.getSchema().label}
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

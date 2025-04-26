import {
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  React,
} from "jimu-core";
import { useRef, useState } from "react";
import { Select, Option, Button, Progress } from "jimu-ui";

import * as unionOperator from "@arcgis/core/geometry/operators/unionOperator.js";

import { SpatialRelationship } from "@esri/arcgis-rest-feature-service";

type LocationFormProps = {
  featureLayerDataSources: FeatureLayerDataSource[];
  widgetId: string;
  toggleDialog: () => void;
};

const spatialRelationships = [
  { value: "esriSpatialRelIntersects", label: "Intersects" },
  { value: "esriSpatialRelContains", label: "Contains" },
  { value: "esriSpatialRelCrosses", label: "Crosses" },
  { value: "esriSpatialRelEnvelopeIntersects", label: "Envelope Intersects" },
  { value: "esriSpatialRelIndexIntersects", label: "Index Intersects" },
  { value: "esriSpatialRelOverlaps", label: "Overlaps" },
  { value: "esriSpatialRelTouches", label: "Touches" },
  { value: "esriSpatialRelWithin", label: "Within" },
];

import Graphic from "esri/Graphic";

export default function LocationForm({
  featureLayerDataSources,
  widgetId,
  toggleDialog,
}: LocationFormProps) {
  const [inputLayer, setInputLayer] = useState("");
  const [selectingFeatures, setSelectingFeatures] = useState("");
  const [selectionType, setSelectionType] = useState("new");
  const [selectionProgress, setSelectionProgress] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDataSource, setSelectedDataSource] =
    useState<FeatureLayerDataSource>(null);
  const [selectingDataSource, setSelectingDataSource] =
    useState<FeatureLayerDataSource>(null);

  const mainControllerRef = useRef<AbortController | null>(null);
  const secondControllerRef = useRef<AbortController | null>(null);
  const [relationship, setRelationship] = useState<SpatialRelationship>(null);

  function handleInputLayerChange(_, inputLayerId) {
    setInputLayer(inputLayerId);
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }

  function handleRelationshipChange(_, relationship) {
    setRelationship(relationship);
  }

  async function executeSelection() {
    if (!selectedDataSource) return;

    try {
      // Cancel previous query if it's still running
      if (mainControllerRef.current) {
        mainControllerRef.current.abort();
      }

      if (secondControllerRef.current) {
        secondControllerRef.current.abort();
      }
      setIsLoading(true);

      mainControllerRef.current = new AbortController();
      secondControllerRef.current = new AbortController();
      let selectedFeatures =
        selectingDataSource.getSelectedRecords() as FeatureDataRecord[];

      if (selectedFeatures.length === 0) {
        console.log("No records selected, loading all records.");
        selectedFeatures = (await selectingDataSource.loadAll(
          {
            page: 1,
            pageSize: 2000,
            // @ts-ignore
            returnGeometry: true,
          },
          secondControllerRef.current.signal,
          (progress) => setSelectionProgress(progress),
          { widgetId: widgetId }
        )) as FeatureDataRecord[];
      }

      const geometry = selectedFeatures.map(
        (record) => record.feature.geometry
      );

      // @ts-ignore
      const unionedGeometry = unionOperator.executeMany(geometry);

      const selectingRecord = selectingDataSource.buildRecord(
        new Graphic({
          attributes: {},
          geometry: unionedGeometry,
        })
      );

      await selectedDataSource.selectRecords(
        {
          queryParams: {
            spatialRel: relationship,
            geometry: selectingRecord.getGeometry(),
          },
          widgetId: widgetId,
        },
        mainControllerRef.current.signal,
        (progress) => setSelectionProgress(progress)
      );
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Previous query aborted.");
      } else {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setSelectionProgress(null);
    }
  }

  function handleSelectingFeaturesChange(_, selectingFeaturesId) {
    setSelectingFeatures(selectingFeaturesId);
    const selectingDataSource = DataSourceManager.getInstance().getDataSource(
      selectingFeaturesId
    ) as FeatureLayerDataSource;
    setSelectingDataSource(selectingDataSource);
  }

  return (
    <div
      className="d-flex flex-column p-3"
      style={{ minWidth: "350px", overflowY: "auto" }}
    >
      {/* Input Layer */}

      <Select
        value={inputLayer}
        onChange={handleInputLayerChange}
        placeholder="Input Features"
        className="mt-3"
      >
        {featureLayerDataSources
          .filter((flds) => flds.id != selectingFeatures)
          .map((flds) => (
            <Option key={flds.id} value={flds.id}>
              {flds.layer.title}
            </Option>
          ))}
      </Select>

      {/* Relationship Area */}

      <Select
        value={relationship}
        onChange={handleRelationshipChange}
        placeholder="Relationship Type"
        className="mt-3"
      >
        {spatialRelationships.map((relationship) => {
          return (
            <Option key={relationship.value} value={relationship.value}>
              {relationship.label}
            </Option>
          );
        })}
      </Select>

      <Select
        value={selectingFeatures}
        onChange={handleSelectingFeaturesChange}
        placeholder="Selecting Features"
        className="mt-3"
      >
        {featureLayerDataSources
          .filter((flds) => flds.id != inputLayer)
          .map((flds) => (
            <Option key={flds.id} value={flds.id}>
              {flds.layer.title}
            </Option>
          ))}
      </Select>

      {/* Selection Type */}

      <Select
        value={selectionType}
        onChange={(e) => setSelectionType(e.target.value)}
        placeholder="Selection Type"
        className="mt-3"
      >
        <Option value="new">New selection</Option>

        {
          // I dont know how to implement these options yet
          /* <Option value="add">Add to selection</Option>
        <Option value="remove">Remove from selection</Option>
        <Option value="intersect">Select from current selection</Option> */
        }
      </Select>

      {
        // Idont know how to implement this yet
        /* <Label>
        <Checkbox
          checked={invertWhere}
          onChange={(e) => setInvertWhere(e.target.checked)}
          className="mt-2 mr-2"
        ></Checkbox>
        Invert Where Clause
      </Label> */
      }

      {/* Action buttons */}
      <div className="d-flex justify-end mt-3 ml-auto" style={{ gap: "10px" }}>
        <Button
          onClick={() => {
            setIsLoading(false);
            setSelectionProgress(null);
            mainControllerRef.current?.abort();
            secondControllerRef.current?.abort();
          }}
        >
          Cancel
        </Button>
        <Button onClick={executeSelection}>Apply</Button>
        <Button
          type="primary"
          onClick={() => {
            executeSelection();
            toggleDialog();
          }}
        >
          OK
        </Button>
      </div>
      <div className="mt-2">
        {isLoading && (
          <Progress
            color="primary"
            type="linear"
            value={Math.round((selectionProgress ?? 0) * 100)}
          />
        )}
      </div>
    </div>
  );
}

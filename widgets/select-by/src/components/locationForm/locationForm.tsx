import {
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  React,
} from "jimu-core";
import { useEffect, useState, useRef } from "react";
import { Select, Option, Button, Progress } from "jimu-ui";

import * as unionOperator from "@arcgis/core/geometry/operators/unionOperator.js";
import * as geometryJsonUtils from "@arcgis/core/geometry/support/jsonUtils.js";

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
export default function LocationForm({
  featureLayerDataSources,
  widgetId,
  toggleDialog,
}: LocationFormProps) {
  const [inputLayer, setInputLayer] = useState("");
  const [selectingFeatures, setSelectingFeatures] = useState("");
  const [selectionType, setSelectionType] = useState<
    "new" | "add" | "remove" | "intersect"
  >("new");
  const [selectionProgress, setSelectionProgress] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [resultStatus, setResultStatus] = useState<
    "none" | "success" | "warning" | "error"
  >("none");

  const [selectedDataSource, setSelectedDataSource] =
    useState<FeatureLayerDataSource>(null);
  const [selectingDataSource, setSelectingDataSource] =
    useState<FeatureLayerDataSource>(null);

  const mainControllerRef = useRef<AbortController | null>(null);
  const secondControllerRef = useRef<AbortController | null>(null);
  const [relationship, setRelationship] = useState<SpatialRelationship>(null);

  function handleInputLayerChange(_, inputLayerId) {
    setInputLayer(inputLayerId);
    setResultMessage("");
    setResultStatus("none");
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId,
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }

  function handleRelationshipChange(_, relationship) {
    setRelationship(relationship);
    setResultMessage("");
    setResultStatus("none");
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
      return `Selection failed: ${err.message}`;
    }

    return "Selection failed. Please try again.";
  }

  function applySelectionMode(
    dataSource: FeatureLayerDataSource,
    queriedIds: string[],
    mode: "new" | "add" | "remove" | "intersect",
  ): number {
    const currentSelectedIds = dataSource.getSelectedRecordIds() ?? [];
    let nextSelectedIds: string[] = queriedIds;

    if (mode === "add") {
      nextSelectedIds = Array.from(
        new Set([...currentSelectedIds, ...queriedIds]),
      );
    } else if (mode === "remove") {
      const queriedSet = new Set(queriedIds);
      nextSelectedIds = currentSelectedIds.filter((id) => !queriedSet.has(id));
    } else if (mode === "intersect") {
      const queriedSet = new Set(queriedIds);
      nextSelectedIds = currentSelectedIds.filter((id) => queriedSet.has(id));
    }

    dataSource.selectRecordsByIds(nextSelectedIds);
    return nextSelectedIds.length;
  }

  async function executeSelection() {
    if (!selectedDataSource || !selectingDataSource || !relationship) return;

    try {
      // Cancel previous query if it's still running
      if (mainControllerRef.current) {
        mainControllerRef.current.abort();
      }

      if (secondControllerRef.current) {
        secondControllerRef.current.abort();
      }
      setIsLoading(true);
      setResultMessage("");
      setResultStatus("none");

      mainControllerRef.current = new AbortController();
      secondControllerRef.current = new AbortController();
      let selectedFeatures =
        selectingDataSource.getSelectedRecords() as FeatureDataRecord[];

      if (selectedFeatures.length === 0) {
        const loadQuery = {
          page: 1,
          pageSize: 2000,
          returnGeometry: true,
        } as any;

        selectedFeatures = (await selectingDataSource.loadAll(
          loadQuery,
          secondControllerRef.current.signal,
          (progress) => setSelectionProgress(progress),
          { widgetId: widgetId },
        )) as FeatureDataRecord[];
      }

      const geometry = selectedFeatures
        .map((record) => record.feature?.geometry)
        .filter((g) => !!g)
        .map((g) => geometryJsonUtils.fromJSON(g as any))
        .filter((g) => !!g);

      if (geometry.length === 0) {
        setIsLoading(false);
        setSelectionProgress(null);
        return;
      }

      const unionedGeometry = unionOperator.executeMany(geometry);

      if (!unionedGeometry) {
        setIsLoading(false);
        setSelectionProgress(null);
        return;
      }

      const queryParams = {
        spatialRel: relationship,
        geometry: unionedGeometry,
      };

      if (selectionType === "new") {
        const queryResult = await selectedDataSource.selectRecords(
          {
            queryParams,
            widgetId: widgetId,
          },
          mainControllerRef.current.signal,
          (progress) => setSelectionProgress(progress),
        );
        const matchedCount =
          queryResult?.ids?.length ??
          queryResult?.records?.length ??
          queryResult?.count ??
          0;
        const selectedCount = selectedDataSource.getSelectedRecordIds().length;
        setResultMessage(
          matchedCount === 0
            ? "0 matching records"
            : `Matched ${matchedCount} records. Selected ${selectedCount}.`,
        );
        setResultStatus(matchedCount === 0 ? "warning" : "success");
      } else {
        const queryResult = await selectedDataSource.queryIds(queryParams, {
          widgetId,
        });
        const matchedCount = queryResult.ids?.length ?? 0;
        const selectedCount = applySelectionMode(
          selectedDataSource,
          queryResult.ids ?? [],
          selectionType,
        );
        setResultMessage(
          matchedCount === 0
            ? "0 matching records"
            : `Matched ${matchedCount} records. Selected ${selectedCount}.`,
        );
        setResultStatus(matchedCount === 0 ? "warning" : "success");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Previous query aborted.");
      } else {
        setResultMessage(getErrorMessage(err));
        setResultStatus("error");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setSelectionProgress(null);
    }
  }

  function handleSelectingFeaturesChange(_, selectingFeaturesId) {
    setSelectingFeatures(selectingFeaturesId);
    setResultMessage("");
    setResultStatus("none");
    const selectingDataSource = DataSourceManager.getInstance().getDataSource(
      selectingFeaturesId,
    ) as FeatureLayerDataSource;
    setSelectingDataSource(selectingDataSource);
  }

  useEffect(() => {
    return () => {
      mainControllerRef.current?.abort();
      secondControllerRef.current?.abort();
    };
  }, []);

  const canSubmit =
    !!selectedDataSource &&
    !!selectingDataSource &&
    !!relationship &&
    !isLoading;

  return (
    <div
      className="d-flex flex-column p-3"
      style={{
        gap: "0.5rem",
        maxHeight: "50vh",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Input Layer */}

      <Select
        value={inputLayer}
        onChange={handleInputLayerChange}
        placeholder="Input Features"
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
        onChange={(e) => {
          setSelectionType(
            e.target.value as "new" | "add" | "remove" | "intersect",
          );
          setResultMessage("");
          setResultStatus("none");
        }}
        placeholder="Selection Type"
      >
        <Option value="new">New selection</Option>
        <Option value="add">Add to selection</Option>
        <Option value="remove">Remove from selection</Option>
        <Option value="intersect">Select from current selection</Option>
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
      <div className="d-flex justify-content-end" style={{ gap: "0.5rem" }}>
        <Button
          onClick={() => {
            setIsLoading(false);
            setSelectionProgress(null);
            setResultMessage("");
            setResultStatus("none");
            mainControllerRef.current?.abort();
            secondControllerRef.current?.abort();
          }}
        >
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={executeSelection}>
          Apply
        </Button>
        <Button
          type="primary"
          disabled={!canSubmit}
          onClick={() => {
            executeSelection();
            toggleDialog();
          }}
        >
          OK
        </Button>
      </div>
      <div>
        {isLoading && (
          <Progress
            color="primary"
            type="linear"
            value={Math.round((selectionProgress ?? 0) * 100)}
          />
        )}
        {resultMessage && !isLoading && (
          <div
            className={
              resultStatus === "warning"
                ? "text-warning"
                : resultStatus === "success"
                  ? "text-success"
                  : resultStatus === "error"
                    ? "text-danger"
                    : "text-muted"
            }
          >
            {resultMessage}
          </div>
        )}
      </div>
    </div>
  );
}

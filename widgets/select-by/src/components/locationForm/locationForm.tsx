import {
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  React,
} from "jimu-core";
import { useEffect, useState, useRef } from "react";
import { Select, Option, Button, Progress, Label, Switch } from "jimu-ui";

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
  const [useExistingSelection, setUseExistingSelection] = useState(true);
  const [selectingLayerSelectedCount, setSelectingLayerSelectedCount] =
    useState(0);

  const mainControllerRef = useRef<AbortController | null>(null);
  const secondControllerRef = useRef<AbortController | null>(null);
  const [relationship, setRelationship] = useState<SpatialRelationship>(null);

  function handleInputLayerChange(_: unknown, inputLayerId: string) {
    setInputLayer(inputLayerId);
    setResultMessage("");
    setResultStatus("none");
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId,
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }

  function handleRelationshipChange(
    _: unknown,
    relationship: SpatialRelationship,
  ) {
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
      const currentSelectedIds =
        selectingDataSource.getSelectedRecordIds() ?? [];
      const currentSelectedCount = currentSelectedIds.length;
      setSelectingLayerSelectedCount(currentSelectedCount);

      const shouldUseSelectedFeatures = useExistingSelection;
      let selectedFeatures: FeatureDataRecord[] = [];

      if (shouldUseSelectedFeatures) {
        const loadedSelectedRecords = await Promise.all(
          currentSelectedIds.map(async (recordId) => {
            try {
              const record = await selectingDataSource.loadById(recordId);
              return record as FeatureDataRecord;
            } catch {
              return null;
            }
          }),
        );

        selectedFeatures = loadedSelectedRecords.filter(
          (record): record is FeatureDataRecord => !!record,
        );

        if (selectedFeatures.length === 0) {
          selectedFeatures =
            (selectingDataSource.getSelectedRecords() as FeatureDataRecord[]) ??
            [];
        }

        if (selectedFeatures.length === 0) {
          setResultMessage(
            "No selected features available in selecting layer.",
          );
          setResultStatus("warning");
          return;
        }
      }

      if (!shouldUseSelectedFeatures && selectedFeatures.length === 0) {
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
        setResultMessage(
          shouldUseSelectedFeatures
            ? "No geometry found in selected records from the selecting layer."
            : "No geometry found in selecting layer records.",
        );
        setResultStatus("warning");
        return;
      }

      const unionedGeometry = unionOperator.executeMany(geometry);

      if (!unionedGeometry) {
        setResultMessage("Could not build a selection geometry.");
        setResultStatus("warning");
        return;
      }

      const queryParams = {
        spatialRel: relationship,
        geometry: unionedGeometry?.toJSON
          ? unionedGeometry.toJSON()
          : (unionedGeometry as any),
      };

      const queryResult = await selectedDataSource.queryIds(queryParams, {
        widgetId,
      });
      const matchedIds = queryResult.ids ?? [];
      const selectedCount = applySelectionMode(
        selectedDataSource,
        matchedIds,
        selectionType,
      );
      const matchedCount = matchedIds.length;

      setResultMessage(
        matchedCount === 0
          ? "0 matching records"
          : `Matched ${matchedCount} records. Selected ${selectedCount}.`,
      );
      setResultStatus(matchedCount === 0 ? "warning" : "success");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
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

  function handleSelectingFeaturesChange(
    _: unknown,
    selectingFeaturesId: string,
  ) {
    setSelectingFeatures(selectingFeaturesId);
    setResultMessage("");
    setResultStatus("none");
    const selectingDataSource = DataSourceManager.getInstance().getDataSource(
      selectingFeaturesId,
    ) as FeatureLayerDataSource;
    const selectedCount =
      selectingDataSource?.getSelectedRecordIds()?.length ?? 0;

    setSelectingLayerSelectedCount(selectedCount);
    setUseExistingSelection(selectedCount > 0);
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

      {selectingLayerSelectedCount > 0 && (
        <div className="d-flex justify-content-between align-items-center">
          <Label className="mb-0">
            Use existing selection in selecting layer (
            {selectingLayerSelectedCount})
          </Label>
          <Switch
            checked={useExistingSelection}
            onChange={(e) => {
              setUseExistingSelection(e.target.checked);
              setResultMessage("");
              setResultStatus("none");
            }}
          />
        </div>
      )}

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
            toggleDialog();
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
          onClick={async () => {
            await executeSelection();
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

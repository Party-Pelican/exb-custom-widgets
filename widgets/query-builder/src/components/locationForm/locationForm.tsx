import {
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  React,
} from "jimu-core";
import { useRef, useState } from "react";
import { Select, Option, Button, Label } from "jimu-ui";

import * as unionOperator from "@arcgis/core/geometry/operators/unionOperator.js";

import { SpatialRelationship } from "@esri/arcgis-rest-feature-service";
import { geometryUtils, JimuMapView } from "jimu-arcgis";

type LocationFormProps = {
  featureLayerDataSources: FeatureLayerDataSource[];
  widgetId: string;
  jimuMapView: JimuMapView;
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

import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import {
  IMultipoint,
  IPoint,
  IPolygon,
  IPolyline,
  Position,
} from "@esri/arcgis-rest-request";
import { SpatialReference } from "esri/geometry";

type SupportedGeometry = Point | Polyline | Polygon | Multipoint;

function convertEsriGeometry(
  geometry: SupportedGeometry
): IPoint | IPolyline | IPolygon | IMultipoint {
  if (!geometry || !geometry.type) {
    throw new Error("Invalid geometry object");
  }

  switch (geometry.type) {
    case "point": {
      const point = geometry as Point;
      const result: IPoint = {
        x: point.x,
        y: point.y,
        spatialReference: point.spatialReference as SpatialReference,
      };
      return result;
    }

    case "polyline": {
      const polyline = geometry as Polyline;
      const result: IPolyline = {
        paths: polyline.paths as Position[][],
        spatialReference: polyline.spatialReference as SpatialReference,
      };
      return result;
    }

    case "polygon": {
      const polygon = geometry as Polygon;
      const result: IPolygon = {
        rings: polygon.rings as Position[][],
        spatialReference: polygon.spatialReference as SpatialReference,
      };
      return result;
    }

    case "multipoint": {
      const multipoint = geometry as Multipoint;
      const result: IMultipoint = {
        points: multipoint.points as Position[],
        spatialReference: multipoint.spatialReference as SpatialReference,
      };
      return result;
    }

    default:
      // @ts-ignore
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }
}

export default function LocationForm({
  featureLayerDataSources,
  widgetId,
  jimuMapView,
  toggleDialog,
}: LocationFormProps) {
  const [inputLayer, setInputLayer] = useState("");
  const [selectingFeatures, setSelectingFeatures] = useState("");
  const [selectionType, setSelectionType] = useState("new");

  const [invertWhere, setInvertWhere] = useState(false);
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
          (progress, result) => console.log("progress", progress),
          { widgetId: widgetId }
        )) as FeatureDataRecord[];
      }

      const geometry = selectedFeatures.map(
        (record) => record.feature.geometry
      );

      // @ts-ignore
      const unionedGeometry = unionOperator.executeMany(geometry);

      // Testing to see the unioned geometry
      // jimuMapView.view.graphics.add(
      //   new Graphic({
      //     geometry: unionedGeometry,
      //     symbol: {
      //       type: "simple-fill", // For polygon geometries
      //       color: [0, 0, 0, 0], // Transparent fill
      //       outline: {
      //         color: [255, 0, 0, 1], // Red outline
      //         width: 2,
      //       },
      //     },
      //   })
      // );

      const selectResults = await selectedDataSource.selectRecords(
        {
          queryParams: {
            spatialRel: relationship,
            geometry: convertEsriGeometry(unionedGeometry as SupportedGeometry),
          },
          widgetId: widgetId,
        },
        mainControllerRef.current.signal
      );
      console.log("selectResults", selectResults);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Previous query aborted.");
      } else {
        console.error(err);
      }
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
    <div className="d-flex flex-column p-3" style={{ minWidth: "350px" }}>
      {/* Input Rows */}
      <Label className="mt-3">Input Features</Label>

      <Select
        value={inputLayer}
        onChange={handleInputLayerChange}
        placeholder="Select a Layer"
      >
        {featureLayerDataSources
          .filter((flds) => flds.id != selectingFeatures)
          .map((flds) => (
            <Option key={flds.id} value={flds.id}>
              {flds.layer.title}
            </Option>
          ))}
      </Select>

      {/* Expression Area */}
      <Label className="mt-3">Relationship</Label>

      <Select
        value={relationship}
        onChange={handleRelationshipChange}
        placeholder="Select a Relationship"
      >
        {spatialRelationships.map((relationship) => {
          return (
            <Option key={relationship.value} value={relationship.value}>
              {relationship.label}
            </Option>
          );
        })}
      </Select>

      <Label className="mt-3">Selecting Features</Label>

      <Select
        value={selectingFeatures}
        onChange={handleSelectingFeaturesChange}
        placeholder="Select a Layer"
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
      <Label className="mt-3">Selection Type</Label>
      <Select
        value={selectionType}
        onChange={(e) => setSelectionType(e.target.value)}
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
    </div>
  );
}

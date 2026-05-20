import { useEffect, useRef, useState } from "react";
import {
  Tabs,
  Tab,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextInput,
} from "jimu-ui";
import {
  DataRecord,
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  FeatureLayerQueryParams,
  QueriableDataSource,
  React,
  UseDataSource,
} from "jimu-core";
import Graphic from "@arcgis/core/Graphic.js";
import { ArcgisFeatures } from "@arcgis/map-components-react";
import {
  CalciteTable,
  CalciteTableCell,
  CalciteTableHeader,
  CalciteTableRow,
} from "calcite-components";
import { RelationshipDefinition } from "../config";
import { useWidgetContext } from "./context";

type RenderRelatedRecordsProps = {
  widgetId: string;
  relationshipDefinitions: RelationshipDefinition[];
};

async function queryJunctionTable(
  whereClause: string,
  junctionDataSource: UseDataSource,
): Promise<DataRecord[]> {
  // Implement logic to query the junction table and retrieve related records
  console.log("Querying junction table with where clause: ", whereClause);
  console.log("Using junction data source: ", junctionDataSource);
  const dsManager = DataSourceManager.getInstance();
  const dataSource =
    dsManager.getDataSource(junctionDataSource.dataSourceId) ??
    (await dsManager.createDataSourceByUseDataSource(junctionDataSource));
  if (!dataSource) {
    console.error(
      "Junction data source not found: ",
      junctionDataSource.dataSourceId,
    );
    return [];
  }
  if (!("query" in dataSource)) {
    console.error(
      "Unsupported data source type for junction table: ",
      dataSource.type,
    );
    return [];
  }
  const result = await (dataSource as QueriableDataSource).query({
    where: whereClause,
    outFields: ["*"],
  } as FeatureLayerQueryParams);
  console.log("Junction table query result: ", result);
  return result.records ?? [];
}

async function queryRelatedRecords(
  whereClause: string,
  relatedDatasource: UseDataSource,
): Promise<DataRecord[]> {
  // Implement logic to query related records based on the selected source record
  console.log("Querying related records with where clause: ", whereClause);
  console.log("Using related data source: ", relatedDatasource);
  const dsManager = DataSourceManager.getInstance();
  const dataSource =
    dsManager.getDataSource(relatedDatasource.dataSourceId) ??
    (await dsManager.createDataSourceByUseDataSource(relatedDatasource));
  if (!dataSource) {
    console.error(
      "Related data source not found: ",
      relatedDatasource.dataSourceId,
    );
    return [];
  }
  if (!("query" in dataSource)) {
    console.error(
      "Unsupported data source type for related records: ",
      dataSource.type,
    );
    return [];
  }
  const result = await (dataSource as QueriableDataSource).query({
    where: whereClause,
    outFields: ["*"],
  } as FeatureLayerQueryParams);
  console.log("Related records query result: ", result);
  return result.records ?? [];
}

function getSourceRecordIds(
  selectedDataRecords: DataRecord[],
  sourceField: string,
): (string | number | boolean | Date | object | null)[] {
  // Extract the IDs of the selected source records to use in the where clause
  return selectedDataRecords.map((record) => record.getFieldValue(sourceField));
}

function buildWhereClause(
  field: string,
  ids: (string | number | boolean | Date | object | null)[],
): string {
  if (ids.length === 0) {
    return "1=0";
  }
  const literals = ids.map((id) =>
    typeof id === "string" ? `'${id.replace(/'/g, "''")}'` : String(id),
  );
  return `${field} IN (${literals.join(", ")})`;
}

async function fetchRelatedRecords(
  relDef: RelationshipDefinition,
  selectedDataRecords: DataRecord[],
): Promise<DataRecord[]> {
  const sourceIds = getSourceRecordIds(selectedDataRecords, relDef.sourceField);

  if (relDef.type === "field-relate") {
    const where = buildWhereClause(relDef.targetField, sourceIds);
    return queryRelatedRecords(where, relDef.targetDataSource);
  } else {
    const junctionWhere = buildWhereClause(
      relDef.junctionSourceField,
      sourceIds,
    );
    console.log("Junction Where Clause: ", junctionWhere);
    const junctionRecords = await queryJunctionTable(
      junctionWhere,
      relDef.junctionDataSource,
    );
    console.log("Junction Records: ", junctionRecords);
    const targetIds = junctionRecords.map(
      (r) => r.getData()?.[relDef.junctionTargetField],
    );
    const targetWhere = buildWhereClause(relDef.targetField, targetIds);
    console.log("Target Where Clause: ", targetWhere);
    return queryRelatedRecords(targetWhere, relDef.targetDataSource);
  }
}

async function queryAllTargetRecords(
  targetDataSource: UseDataSource,
): Promise<DataRecord[]> {
  const dsManager = DataSourceManager.getInstance();
  const dataSource =
    dsManager.getDataSource(targetDataSource.dataSourceId) ??
    (await dsManager.createDataSourceByUseDataSource(targetDataSource));
  if (!dataSource || !("query" in dataSource)) return [];
  const result = await (dataSource as QueriableDataSource).query({
    where: "1=1",
    outFields: ["*"],
  } as FeatureLayerQueryParams);
  return result.records ?? [];
}

async function performRelate(
  relDef: RelationshipDefinition,
  sourceRecords: DataRecord[],
  targetRecord: DataRecord,
): Promise<void> {
  const dsManager = DataSourceManager.getInstance();
  const sourceValue = sourceRecords[0]?.getData()?.[relDef.sourceField];

  if (relDef.type === "field-relate") {
    const targetDs = dsManager.getDataSource(
      relDef.targetDataSource.dataSourceId,
    ) as unknown as FeatureLayerDataSource;
    if (!targetDs?.layer) throw new Error("Target layer not available.");
    const feature = (
      targetRecord as unknown as FeatureDataRecord
    ).getFeature() as __esri.Graphic;
    if (!feature) throw new Error("Target feature not available.");
    const updated = feature.clone();
    updated.attributes[relDef.targetField] = sourceValue;
    const result = await (targetDs.layer as __esri.FeatureLayer).applyEdits({
      updateFeatures: [updated],
    });
    const errs = result.updateFeatureResults?.filter((r: any) => r.error);
    if (errs?.length) {
      throw new Error(errs[0].error?.message ?? "Update failed.");
    }
  } else {
    const junctionDs = dsManager.getDataSource(
      relDef.junctionDataSource.dataSourceId,
    ) as unknown as FeatureLayerDataSource;
    if (!junctionDs?.layer) throw new Error("Junction layer not available.");
    const targetValue = targetRecord.getData()?.[relDef.targetField];
    const newFeature = new Graphic({
      attributes: {
        [relDef.junctionSourceField]: sourceValue,
        [relDef.junctionTargetField]: targetValue,
      },
    });
    const result = await (junctionDs.layer as __esri.FeatureLayer).applyEdits({
      addFeatures: [newFeature],
    });
    const errs = result.addFeatureResults?.filter((r: any) => r.error);
    if (errs?.length) {
      throw new Error(errs[0].error?.message ?? "Insert failed.");
    }
  }
}

export default function RenderRelatedRecords(props: RenderRelatedRecordsProps) {
  const { selectedDataRecords, setRelatedSelection, jimuMapView } =
    useWidgetContext();
  const [relatedRecords, setRelatedRecordsState] = useState<
    Record<number, DataRecord[]>
  >({});
  const featuresRefs = useRef<Record<number, HTMLArcgisFeaturesElement | null>>(
    {},
  );

  useEffect(() => {
    if (!selectedDataRecords?.length) {
      setRelatedRecordsState({});
      return;
    }

    let isMounted = true;

    props.relationshipDefinitions.forEach((relDef, index) => {
      fetchRelatedRecords(relDef, selectedDataRecords)
        .then((records) => {
          if (!isMounted) return;
          console.log(`Related records for "${relDef.label}":`, records);
          setRelatedSelection(index, records);
          setRelatedRecordsState((prev) => ({ ...prev, [index]: records }));
        })
        .catch((err) => {
          console.error(
            `Error fetching related records for "${relDef.label}":`,
            err,
          );
        });
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDataRecords, props.relationshipDefinitions]);

  // Drive ArcgisFeatures imperatively when records change
  useEffect(() => {
    for (const [indexStr, records] of Object.entries(relatedRecords)) {
      const el = featuresRefs.current[Number(indexStr)];
      if (!el) continue;
      const graphics = records
        .map(
          (r) =>
            (r as unknown as FeatureDataRecord).getFeature() as __esri.Graphic,
        )
        .filter(Boolean);
      if (graphics.length > 0) {
        el.open({ features: graphics });
      } else {
        el.clear();
      }
    }
  }, [relatedRecords]);

  const [relatingIndex, setRelatingIndex] = useState<number | null>(null);
  const [pickerRecords, setPickerRecords] = useState<DataRecord[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSelectedIndex, setPickerSelectedIndex] = useState<number | null>(
    null,
  );
  const [pickerFilterText, setPickerFilterText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (relatingIndex === null) {
      setPickerRecords([]);
      setPickerSelectedIndex(null);
      setPickerFilterText("");
      return;
    }
    const relDef = props.relationshipDefinitions[relatingIndex];
    setPickerLoading(true);
    queryAllTargetRecords(relDef.targetDataSource)
      .then((records) => {
        setPickerRecords(records);
      })
      .catch((err) =>
        console.error("Error fetching target records for picker:", err),
      )
      .finally(() => setPickerLoading(false));
  }, [relatingIndex, props.relationshipDefinitions]);

  const map = jimuMapView?.view?.map;

  if (!selectedDataRecords?.length) {
    return null;
  }

  const activeRelDef =
    relatingIndex !== null
      ? props.relationshipDefinitions[relatingIndex]
      : null;
  const pickerColumns =
    pickerRecords.length > 0
      ? Object.keys(pickerRecords[0].getData() ?? {})
      : [];
  const pickerFilterLower = pickerFilterText.toLowerCase();
  const filteredPickerRecords = pickerFilterLower
    ? pickerRecords
        .map((r, i) => ({ record: r, originalIndex: i }))
        .filter(({ record }) =>
          Object.values(record.getData() ?? {}).some((v) =>
            String(v ?? "")
              .toLowerCase()
              .includes(pickerFilterLower),
          ),
        )
    : pickerRecords.map((r, i) => ({ record: r, originalIndex: i }));
  const pickerSelectedRecord =
    pickerSelectedIndex !== null ? pickerRecords[pickerSelectedIndex] : null;

  return (
    <>
      <Tabs type="tabs">
        {props.relationshipDefinitions.map((relDef, index) => {
          const records = relatedRecords[index] ?? [];
          return (
            <Tab key={index} id={`related-${index + 1}`} title={relDef.label}>
              <Button
                size="sm"
                style={{ margin: "0.5rem 0" }}
                onClick={() => setRelatingIndex(index)}
              >
                Relate
              </Button>
              {records.length === 0 && <div>No related records found.</div>}
              {map && (
                <div
                  style={{
                    display: records.length === 0 ? "none" : "block",
                  }}
                >
                  <ArcgisFeatures
                    hideCloseButton
                    hideActionBar
                    featureNavigationTop
                    initialDisplayMode="list"
                    map={map}
                    ref={(el: HTMLArcgisFeaturesElement | null) => {
                      featuresRefs.current[index] = el;
                      if (el && records.length > 0) {
                        const graphics = records
                          .map(
                            (r) =>
                              (
                                r as unknown as FeatureDataRecord
                              ).getFeature() as __esri.Graphic,
                          )
                          .filter(Boolean);
                        if (graphics.length > 0)
                          el.open({ features: graphics });
                      }
                    }}
                  />
                </div>
              )}
            </Tab>
          );
        })}
      </Tabs>

      <Modal
        isOpen={relatingIndex !== null}
        toggle={() => setRelatingIndex(null)}
        size="xl"
      >
        <ModalHeader toggle={() => setRelatingIndex(null)}>
          {activeRelDef ? `Relate — ${activeRelDef.label}` : ""}
        </ModalHeader>
        <ModalBody>
          {pickerLoading ? (
            <div>Loading records…</div>
          ) : pickerRecords.length === 0 ? (
            <div>No records found in target layer.</div>
          ) : (
            <>
              <TextInput
                placeholder="Search…"
                value={pickerFilterText}
                onChange={(e) => {
                  setPickerSelectedIndex(null);
                  setPickerFilterText(e.target.value);
                }}
                style={{ marginBottom: "0.5rem", width: "100%" }}
              />
              <div
                style={{
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: "55vh",
                }}
              >
                <CalciteTable
                  key={`picker-table-${relatingIndex}`}
                  bordered
                  striped
                  selectionMode="single"
                  caption={
                    activeRelDef
                      ? `Select a ${activeRelDef.label} record to relate`
                      : ""
                  }
                  style={{ width: "100%" }}
                >
                  <CalciteTableRow slot="table-header">
                    {pickerColumns.map((col) => (
                      <CalciteTableHeader key={col} heading={col} />
                    ))}
                  </CalciteTableRow>
                  {filteredPickerRecords.map(({ record, originalIndex }) => {
                    const data = record.getData() ?? {};
                    return (
                      <CalciteTableRow
                        key={originalIndex}
                        selected={pickerSelectedIndex === originalIndex}
                        onClick={() =>
                          setPickerSelectedIndex(
                            pickerSelectedIndex === originalIndex
                              ? null
                              : originalIndex,
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {pickerColumns.map((col) => (
                          <CalciteTableCell key={col}>
                            <div
                              title={String(data[col] ?? "")}
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "200px",
                              }}
                            >
                              {String(data[col] ?? "")}
                            </div>
                          </CalciteTableCell>
                        ))}
                      </CalciteTableRow>
                    );
                  })}
                </CalciteTable>
              </div>
              {filteredPickerRecords.length === 0 && (
                <div style={{ padding: "0.5rem", color: "#666" }}>
                  No records match your search.
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter style={{ flexDirection: "column", alignItems: "stretch" }}>
          {saveError && (
            <div
              style={{
                color: "#c00",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {saveError}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button
              color="primary"
              disabled={pickerSelectedRecord === null || isSaving}
              onClick={async () => {
                if (!pickerSelectedRecord || !activeRelDef) return;
                const idx = relatingIndex!;
                setIsSaving(true);
                setSaveError(null);
                try {
                  await performRelate(
                    activeRelDef,
                    selectedDataRecords,
                    pickerSelectedRecord,
                  );
                  const freshRecords = await fetchRelatedRecords(
                    activeRelDef,
                    selectedDataRecords,
                  );
                  setRelatedSelection(idx, freshRecords);
                  setRelatedRecordsState((prev) => ({
                    ...prev,
                    [idx]: freshRecords,
                  }));
                  setRelatingIndex(null);
                } catch (err) {
                  setSaveError(
                    err instanceof Error
                      ? err.message
                      : "An unknown error occurred.",
                  );
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? "Saving…" : "Confirm"}
            </Button>
            <Button disabled={isSaving} onClick={() => setRelatingIndex(null)}>
              Cancel
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
}

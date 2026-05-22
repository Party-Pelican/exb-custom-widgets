import {
  DataSourceManager,
  FeatureLayerQueryParams,
  type ArcGISQueriableDataSource,
  type DataRecord,
  type QueriableDataSource,
  type UseDataSource,
} from "jimu-core";
import Graphic from "esri/Graphic";
import type { RelationshipDefinition } from "../config";

export async function getOrCreateDs(
  ds: UseDataSource,
  signal?: AbortSignal,
): Promise<QueriableDataSource | null> {
  const mgr = DataSourceManager.getInstance();
  const found =
    mgr.getDataSource(ds.dataSourceId) ??
    (await mgr.createDataSourceByUseDataSource(ds));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (!found || !("query" in found)) return null;
  return found as QueriableDataSource;
}

export async function queryDs(
  ds: UseDataSource,
  where: string,
  signal?: AbortSignal,
): Promise<DataRecord[]> {
  const src = await getOrCreateDs(ds, signal);
  if (!src) return [];
  const result = await src.queryAll(
    { where, outFields: ["*"] } as FeatureLayerQueryParams,
    signal,
  );
  return result.records ?? [];
}

export function buildWhereClause(
  field: string,
  ids: (string | number | boolean | Date | object | null)[],
): string {
  if (ids.length === 0) return "1=0";
  const literals = ids.map((id) =>
    typeof id === "string" ? `'${id.replace(/'/g, "''")}'` : String(id),
  );
  return `${field} IN (${literals.join(", ")})`;
}

export async function removeRelatedRecord(
  relDef: RelationshipDefinition,
  sourceRecord: DataRecord,
  targetRecord: DataRecord,
  signal?: AbortSignal,
): Promise<void> {
  if (relDef.type === "field-relate") {
    // Null out the join field directly via layer.applyEdits to avoid jimu
    // record-cache requirements on updateRecord().
    const targetDs = await getOrCreateDs(relDef.targetDataSource, signal);
    if (!targetDs) return;
    const layer = (targetDs as unknown as ArcGISQueriableDataSource)
      .layer as __esri.FeatureLayer;
    if (!layer) return;
    const oid = parseInt(targetRecord.getId(), 10);
    const updateFeature = new Graphic({
      attributes: { [layer.objectIdField]: oid, [relDef.targetField]: null },
    });
    await layer.applyEdits({ updateFeatures: [updateFeature] });
  } else {
    // junction-table: delete the junction row(s) that link source ↔ target
    const sourceValue = sourceRecord.getFieldValue(relDef.sourceField);
    const targetValue = targetRecord.getFieldValue(relDef.targetField);
    const junctionWhere =
      buildWhereClause(relDef.junctionSourceField, [sourceValue]) +
      " AND " +
      buildWhereClause(relDef.junctionTargetField, [targetValue]);
    const junctionRecords = await queryDs(
      relDef.junctionDataSource,
      junctionWhere,
      signal,
    );
    if (junctionRecords.length === 0) return;
    const junctionDs = await getOrCreateDs(relDef.junctionDataSource, signal);
    if (!junctionDs) return;
    const junctionLayer = (junctionDs as unknown as ArcGISQueriableDataSource)
      .layer as __esri.FeatureLayer;
    if (!junctionLayer) return;
    const deleteFeatures = junctionRecords.map(
      (jr) =>
        new Graphic({
          attributes: {
            [junctionLayer.objectIdField]: parseInt(jr.getId(), 10),
          },
        }),
    );
    await junctionLayer.applyEdits({ deleteFeatures });
  }
}

export async function addRelatedRecord(
  relDef: RelationshipDefinition,
  sourceRecord: DataRecord,
  targetRecords: DataRecord[],
  signal?: AbortSignal,
): Promise<void> {
  if (targetRecords.length === 0) return;

  if (relDef.type === "field-relate") {
    const targetDs = await getOrCreateDs(relDef.targetDataSource, signal);
    if (!targetDs) return;
    const layer = (targetDs as unknown as ArcGISQueriableDataSource)
      .layer as __esri.FeatureLayer;
    if (!layer) return;
    const sourceValue = sourceRecord.getFieldValue(relDef.sourceField);
    const updateFeatures = targetRecords.map(
      (tr) =>
        new Graphic({
          attributes: {
            [layer.objectIdField]: parseInt(tr.getId(), 10),
            [relDef.targetField]: sourceValue,
          },
        }),
    );
    await layer.applyEdits({ updateFeatures });
  } else {
    // junction-table: insert a new row for each source ↔ target pair
    const junctionDs = await getOrCreateDs(relDef.junctionDataSource, signal);
    if (!junctionDs) return;
    const junctionLayer = (junctionDs as unknown as ArcGISQueriableDataSource)
      .layer as __esri.FeatureLayer;
    if (!junctionLayer) return;
    const sourceValue = sourceRecord.getFieldValue(relDef.sourceField);
    const addFeatures = targetRecords.map(
      (tr) =>
        new Graphic({
          attributes: {
            [relDef.junctionSourceField]: sourceValue,
            [relDef.junctionTargetField]: tr.getFieldValue(relDef.targetField),
          },
        }),
    );
    await junctionLayer.applyEdits({ addFeatures });
  }
}

export async function fetchRelatedRecords(
  relDef: RelationshipDefinition,
  sourceRecords: DataRecord[],
  signal?: AbortSignal,
): Promise<DataRecord[]> {
  const sourceIds = sourceRecords.map((r) =>
    r.getFieldValue(relDef.sourceField),
  );

  if (relDef.type === "field-relate") {
    const where = buildWhereClause(relDef.targetField, sourceIds);
    return queryDs(relDef.targetDataSource, where, signal);
  }

  // junction-table: first query the junction, then resolve target IDs
  const junctionWhere = buildWhereClause(relDef.junctionSourceField, sourceIds);
  const junctionRecords = await queryDs(
    relDef.junctionDataSource,
    junctionWhere,
    signal,
  );
  const targetIds = junctionRecords.map(
    (r) => r.getData()?.[relDef.junctionTargetField],
  );
  const targetWhere = buildWhereClause(relDef.targetField, targetIds);
  return queryDs(relDef.targetDataSource, targetWhere, signal);
}

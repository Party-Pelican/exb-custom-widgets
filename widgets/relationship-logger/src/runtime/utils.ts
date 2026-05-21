import {
  DataSourceManager,
  FeatureLayerQueryParams,
  type DataRecord,
  type QueriableDataSource,
  type UseDataSource,
} from "jimu-core";
import type { RelationshipDefinition } from "../config";

export async function getOrCreateDs(
  ds: UseDataSource,
): Promise<QueriableDataSource | null> {
  const mgr = DataSourceManager.getInstance();
  const found =
    mgr.getDataSource(ds.dataSourceId) ??
    (await mgr.createDataSourceByUseDataSource(ds));
  if (!found || !("query" in found)) return null;
  return found as QueriableDataSource;
}

export async function queryDs(
  ds: UseDataSource,
  where: string,
): Promise<DataRecord[]> {
  const src = await getOrCreateDs(ds);
  if (!src) return [];
  const result = await src.query({
    where,
    outFields: ["*"],
  } as FeatureLayerQueryParams);
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

export async function fetchRelatedRecords(
  relDef: RelationshipDefinition,
  sourceRecords: DataRecord[],
): Promise<DataRecord[]> {
  const sourceIds = sourceRecords.map((r) =>
    r.getFieldValue(relDef.sourceField),
  );

  if (relDef.type === "field-relate") {
    const where = buildWhereClause(relDef.targetField, sourceIds);
    return queryDs(relDef.targetDataSource, where);
  }

  // junction-table: first query the junction, then resolve target IDs
  const junctionWhere = buildWhereClause(relDef.junctionSourceField, sourceIds);
  const junctionRecords = await queryDs(
    relDef.junctionDataSource,
    junctionWhere,
  );
  const targetIds = junctionRecords.map(
    (r) => r.getData()?.[relDef.junctionTargetField],
  );
  const targetWhere = buildWhereClause(relDef.targetField, targetIds);
  return queryDs(relDef.targetDataSource, targetWhere);
}

import { useEffect, useState } from "react";
import { Tabs, Tab } from "jimu-ui";
import {
  DataRecord,
  DataSourceManager,
  FeatureLayerQueryParams,
  QueriableDataSource,
  React,
  UseDataSource,
} from "jimu-core";
import { RelationshipDefinition } from "../config";
import { useWidgetContext } from "./context";
import {
  CalciteTable,
  CalciteTableCell,
  CalciteTableHeader,
  CalciteTableRow,
} from "calcite-components";

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

function RecordsTable({ records }: { records: DataRecord[] }) {
  if (records.length === 0) {
    return <div>No related records found.</div>;
  }

  const columns = Object.keys(records[0].getData() ?? {});

  return (
    <CalciteTable caption="Related records" style={{ width: "100%" }}>
      <CalciteTableRow slot="table-header">
        {columns.map((col) => (
          <CalciteTableHeader key={col} heading={col} />
        ))}
      </CalciteTableRow>
      {records.map((record, i) => {
        const data = record.getData() ?? {};
        return (
          <CalciteTableRow key={i}>
            {columns.map((col) => (
              <CalciteTableCell key={col}>
                {String(data[col] ?? "")}
              </CalciteTableCell>
            ))}
          </CalciteTableRow>
        );
      })}
    </CalciteTable>
  );
}

export default function RenderRelatedRecords(props: RenderRelatedRecordsProps) {
  const { selectedDataRecords, setRelatedSelection } = useWidgetContext();
  const [relatedRecords, setRelatedRecordsState] = useState<
    Record<number, DataRecord[]>
  >({});

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

  return (
    <Tabs type="tabs">
      {props.relationshipDefinitions.map((relDef, index) => {
        const records = relatedRecords[index] ?? [];
        return (
          <Tab key={index} id={`related-${index + 1}`} title={relDef.label}>
            <RecordsTable records={records} />
          </Tab>
        );
      })}
    </Tabs>
  );
}

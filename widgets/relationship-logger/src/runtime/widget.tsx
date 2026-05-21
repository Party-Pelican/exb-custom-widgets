import { useEffect, useMemo, useRef, useState } from "react";
import {
  DataSource,
  DataSourceComponent,
  Immutable,
  React,
  type AllWidgetProps,
  type DataRecord,
  type ImmutableArray,
} from "jimu-core";
import { type IMConfig, type RelationshipDefinition } from "../config";
import RenderRelationships from "./components/renderRelationships";
import { fetchRelatedRecords } from "./utils";
import type { RelatedRecordsByDs } from "./types";

export type { RelatedRecordsByDs } from "./types";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const dsRef = useRef<DataSource>(null);
  const [selectedRecords, setSelectedRecords] = useState<DataRecord[]>([]);
  const [relatedRecordsByDs, setRelatedRecordsByDs] =
    useState<RelatedRecordsByDs>({});

  const sourceDataSource = useMemo(
    () =>
      props.config.sourceData
        ? props.useDataSources?.find(
            (ds) => ds.dataSourceId === props.config.sourceData.dataSourceId,
          )
        : null,
    [props.config.sourceData, props.useDataSources],
  );

  const relationships = useMemo<RelationshipDefinition[]>(
    () => props.config.relationships?.asMutable({ deep: true }) ?? [],
    [props.config.relationships],
  );

  // Fetch, store, and log related records whenever source selection changes
  useEffect(() => {
    if (selectedRecords.length === 0) {
      console.log("[relationship-logger] Source selection cleared.");
      setRelatedRecordsByDs({});
      return;
    }

    console.group("[relationship-logger] Source selection changed");
    console.log(`  ${selectedRecords.length} record(s) selected:`);
    selectedRecords.forEach((r, i) => console.log(`  [${i}]`, r.getData()));
    console.groupEnd();

    if (relationships.length === 0) {
      console.log("[relationship-logger] No relationships configured.");
      setRelatedRecordsByDs({});
      return;
    }

    let isMounted = true;

    Promise.all(
      selectedRecords.map(async (sourceRecord) => {
        const results = await Promise.all(
          relationships.map(async (relDef, index) => {
            console.group(
              `[relationship-logger] Querying relationship [${index}]: "${relDef.label}" for record "${sourceRecord.getId()}"`,
            );
            console.log("  Definition:", relDef);
            try {
              const records = await fetchRelatedRecords(relDef, [sourceRecord]);
              console.log(`  → ${records.length} related record(s):`);
              records.forEach((r, i) => console.log(`    [${i}]`, r.getData()));
              console.groupEnd();
              return { dsId: relDef.targetDataSource.dataSourceId, records };
            } catch (err) {
              console.error(`  → Error fetching related records:`, err);
              console.groupEnd();
              return {
                dsId: relDef.targetDataSource.dataSourceId,
                records: [] as DataRecord[],
              };
            }
          }),
        );
        return { sourceRecordId: sourceRecord.getId(), results };
      }),
    ).then((allResults) => {
      if (!isMounted) return;

      // Group by source record ID, then by target datasource ID.
      // Use a Map for O(n) deduplication by record ID.
      const grouped: RelatedRecordsByDs = {};
      for (const { sourceRecordId, results } of allResults) {
        grouped[sourceRecordId] = {};
        for (const { dsId, records } of results) {
          const unique = new Map(records.map((r) => [r.getId(), r]));
          grouped[sourceRecordId][dsId] = [...unique.values()];
        }
      }

      setRelatedRecordsByDs(grouped);

      console.group("[relationship-logger] Related records by source record");
      for (const [srcId, byDs] of Object.entries(grouped)) {
        console.group(`  Source: ${srcId}`);
        for (const [dsId, records] of Object.entries(byDs)) {
          console.log(
            `    ${dsId}: ${records.length} record(s)`,
            records.map((r) => r.getData()),
          );
        }
        console.groupEnd();
      }
      console.groupEnd();
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRecords, relationships]);

  function handleSelectionChange(_ids: ImmutableArray<string>) {
    if (!dsRef.current) return;
    const selected = dsRef.current.getSelectedRecords();
    setSelectedRecords(selected);
  }

  return (
    <div className="jimu-widget">
      {/* Data source listener */}
      {sourceDataSource && (
        <DataSourceComponent
          useDataSource={Immutable.from(sourceDataSource)}
          widgetId={props.id}
          onDataSourceCreated={(ds) => {
            dsRef.current = ds;
          }}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <RenderRelationships
        selectedSourceRecords={selectedRecords}
        relatedRecordsByDs={relatedRecordsByDs}
        relationships={relationships}
      />
    </div>
  );
}

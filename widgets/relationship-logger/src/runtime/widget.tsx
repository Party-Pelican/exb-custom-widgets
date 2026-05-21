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
  const [isLoading, setIsLoading] = useState(false);

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

    const abortController = new AbortController();
    const { signal } = abortController;
    let pending = selectedRecords.length;

    setIsLoading(true);
    setRelatedRecordsByDs({});

    // Process each source record independently so results appear as they arrive
    // rather than waiting for all records to finish (avoids Promise.all stall).
    selectedRecords.forEach((sourceRecord) => {
      Promise.all(
        relationships.map(async (relDef) => {
          try {
            const records = await fetchRelatedRecords(
              relDef,
              [sourceRecord],
              signal,
            );
            return { dsId: relDef.targetDataSource.dataSourceId, records };
          } catch (err) {
            if ((err as DOMException).name === "AbortError") throw err;
            console.error(`  → Error fetching related records:`, err);
            return {
              dsId: relDef.targetDataSource.dataSourceId,
              records: [] as DataRecord[],
            };
          }
        }),
      )
        .then((results) => {
          if (signal.aborted) return;
          // Deduplicate by record ID and merge into state immediately.
          const perDs: Record<string, DataRecord[]> = {};
          for (const { dsId, records } of results) {
            const unique = new Map(records.map((r) => [r.getId(), r]));
            perDs[dsId] = [...unique.values()];
          }
          setRelatedRecordsByDs((prev) => ({
            ...prev,
            [sourceRecord.getId()]: perDs,
          }));
          console.group(
            `[relationship-logger] Related records for source: ${sourceRecord.getId()}`,
          );
          for (const [dsId, records] of Object.entries(perDs)) {
            console.log(
              `  ${dsId}: ${records.length} record(s)`,
              records.map((r) => r.getData()),
            );
          }
          console.groupEnd();
        })
        .catch((err: unknown) => {
          if ((err as DOMException).name !== "AbortError") {
            console.error("[relationship-logger] Unexpected error:", err);
          }
        })
        .finally(() => {
          if (signal.aborted) return;
          pending--;
          if (pending === 0) setIsLoading(false);
        });
    });

    return () => {
      console.log("[relationship-logger] Aborting pending fetches...");
      abortController.abort();
      setIsLoading(false);
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
        isLoading={isLoading}
      />
    </div>
  );
}

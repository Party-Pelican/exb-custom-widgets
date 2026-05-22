import { useMemo, useState, useCallback } from "react";
import {
  DataRecord,
  DataSourceManager,
  React,
  geometryUtils,
  type ArcGISQueriableDataSource,
} from "jimu-core";
import { type JimuMapView } from "jimu-arcgis";
import { type RelationshipDefinition } from "../../config";
import {
  Tree,
  TreeAlignmentType,
  TreeCollapseStyle,
  type TreeItemType,
  type TreeExpandItemActionDataType,
  type CommandType,
  type CommandActionDataType,
  _TreeItem,
} from "jimu-ui/basic/list-tree";
import { Loading, LoadingType, ConfirmDialog } from "jimu-ui";
import type { RelatedRecordsByDs } from "../types";
import PlusIcon from "jimu-icons/svg/outlined/editor/plus.svg";
import TrashIcon from "jimu-icons/svg/outlined/editor/trash.svg";
import ZoomToIcon from "jimu-icons/svg/outlined/gis/feature-layer-zoom-to.svg";

// ─── module-level tree-building helpers ──────────────────────────────────────

function getFeatureLayer(dataSource: unknown): __esri.FeatureLayer | null {
  return (
    ((dataSource as ArcGISQueriableDataSource)?.layer as __esri.FeatureLayer) ??
    null
  );
}

function buildGroupNode(
  groupKey: string,
  dsId: string,
  records: DataRecord[],
  relationships: RelationshipDefinition[],
  expandedKeys: Record<string, boolean>,
): TreeItemType {
  const relDef = relationships.find(
    (r) => r.targetDataSource.dataSourceId === dsId,
  );
  const layer = getFeatureLayer(records[0]?.dataSource);
  const displayField = layer?.displayField ?? null;
  return {
    itemKey: groupKey,
    itemStateTitle: relDef?.label ?? dsId,
    itemStateExpanded: expandedKeys[groupKey] ?? true,
    itemChildren: records.map(
      (rel): TreeItemType => ({
        itemKey: rel.getId(),
        itemStateTitle: displayField
          ? String(rel.getFieldValue(displayField) ?? rel.getId())
          : rel.getId(),
        itemStateCommands: [
          {
            key: "remove-related",
            label: "Remove related record",
            onlyShowOnHover: true,
            iconProps: { icon: TrashIcon, size: 12 },
          } as CommandType,
        ],
      }),
    ),
  };
}

function buildSourceRecordNode(
  record: DataRecord,
  displayField: string | null,
  perRecordDs: Record<string, DataRecord[]>,
  relationships: RelationshipDefinition[],
  expandedKeys: Record<string, boolean>,
  extraCommands: CommandType[],
): TreeItemType {
  const relatedChildren: TreeItemType[] = Object.entries(perRecordDs)
    .filter(([, records]) => records.length > 0)
    .map(
      ([dsId, records]): TreeItemType =>
        buildGroupNode(
          `${record.getId()}-${dsId}`,
          dsId,
          records,
          relationships,
          expandedKeys,
        ),
    );
  return {
    itemKey: record.getId(),
    itemStateTitle: displayField
      ? String(record.getFieldValue(displayField) ?? record.getId())
      : record.getId(),
    itemStateExpanded: expandedKeys[record.getId()] ?? true,
    itemStateCommands: [
      {
        key: "add-related",
        label: "Add related record",
        onlyShowOnHover: true,
        iconProps: { icon: PlusIcon, size: 12 },
      } as CommandType,
      ...extraCommands,
    ],
    itemChildren: relatedChildren,
  };
}

// ─── component ───────────────────────────────────────────────────────────────

interface PendingRemoval {
  sourceRecord: DataRecord;
  targetRecord: DataRecord;
  relDef: RelationshipDefinition;
  displayTitle: string;
}

interface PendingAddMatch {
  relDef: RelationshipDefinition;
  targetRecords: DataRecord[];
  displayTitles: string[];
}

interface PendingAdd {
  sourceRecord: DataRecord;
  matches: PendingAddMatch[];
}

function formatAddContent(pendingAdd: PendingAdd): string {
  if (pendingAdd.matches.length === 1) {
    const { relDef, displayTitles } = pendingAdd.matches[0];
    return `Add ${displayTitles.length} record(s) via “${relDef.label}”: ${displayTitles.join(", ")}`;
  }
  return pendingAdd.matches
    .map(
      ({ relDef, displayTitles }) =>
        `${relDef.label}: ${displayTitles.join(", ")}`,
    )
    .join(". ");
}

interface RenderRelationshipsProps {
  selectedSourceRecords: DataRecord[];
  relatedRecordsByDs?: RelatedRecordsByDs;
  relationships?: RelationshipDefinition[];
  isLoading?: boolean;
  jimuMapView?: JimuMapView | null;
  onRemoveRelatedRecord?: (
    sourceRecord: DataRecord,
    targetRecord: DataRecord,
    relDef: RelationshipDefinition,
  ) => void;
  onAddRelatedRecord?: (
    sourceRecord: DataRecord,
    relDef: RelationshipDefinition,
    targetRecords: DataRecord[],
  ) => Promise<void>;
}

export default function RenderRelationships(props: RenderRelationshipsProps) {
  const {
    selectedSourceRecords,
    relatedRecordsByDs,
    relationships = [],
    isLoading = false,
    jimuMapView = null,
    onRemoveRelatedRecord,
    onAddRelatedRecord,
  } = props;
  const firstDs = selectedSourceRecords[0]?.dataSource ?? null;

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [noSelectionInfo, setNoSelectionInfo] = useState(false);

  const mapCommands = useMemo((): CommandType[] => {
    if (!jimuMapView) return [];
    return [
      {
        key: "zoom-to",
        label: "Zoom To",
        onlyShowOnHover: true,
        iconProps: { icon: ZoomToIcon, size: 12 },
      } as CommandType,
    ];
  }, [jimuMapView]);

  const handleClickItemCommand = useCallback(
    (actionData: CommandActionDataType, _refComponent: _TreeItem) => {
      const { command, data } = actionData as CommandActionDataType & {
        data?: { itemJsons?: TreeItemType[] };
      };
      const itemKey = data?.itemJsons?.[0]?.itemKey;

      if (command.key === "remove-related") {
        if (itemKey == null) return;
        const relatedId = String(itemKey);
        for (const [sourceRecordId, perDs] of Object.entries(
          relatedRecordsByDs ?? {},
        )) {
          for (const [dsId, records] of Object.entries(perDs)) {
            const targetRecord = records.find((r) => r.getId() === relatedId);
            if (targetRecord) {
              const sourceRecord = selectedSourceRecords.find(
                (r) => r.getId() === sourceRecordId,
              );
              const relDef = relationships.find(
                (r) => r.targetDataSource.dataSourceId === dsId,
              );
              if (sourceRecord && relDef) {
                const layer = getFeatureLayer(targetRecord.dataSource);
                const displayField = layer?.displayField ?? null;
                const displayTitle = displayField
                  ? String(
                      targetRecord.getFieldValue(displayField) ??
                        targetRecord.getId(),
                    )
                  : targetRecord.getId();
                setPendingRemoval({
                  sourceRecord,
                  targetRecord,
                  relDef,
                  displayTitle,
                });
              }
              return;
            }
          }
        }
        return;
      }

      if (command.key === "add-related") {
        if (itemKey == null) return;
        const sourceRecord = selectedSourceRecords.find(
          (r) => r.getId() === String(itemKey),
        );
        if (!sourceRecord) return;
        const mgr = DataSourceManager.getInstance();
        const matches: PendingAddMatch[] = relationships
          .map((relDef): PendingAddMatch | null => {
            const ds = mgr.getDataSource(relDef.targetDataSource.dataSourceId);
            if (!ds) return null;
            const targetRecords: DataRecord[] = ds.getSelectedRecords() ?? [];
            if (targetRecords.length === 0) return null;
            const layer = getFeatureLayer(targetRecords[0]?.dataSource ?? ds);
            const displayField = layer?.displayField ?? null;
            const displayTitles = targetRecords.map((r) =>
              displayField
                ? String(r.getFieldValue(displayField) ?? r.getId())
                : r.getId(),
            );
            return { relDef, targetRecords, displayTitles };
          })
          .filter((m): m is PendingAddMatch => m !== null);
        if (matches.length === 0) {
          setNoSelectionInfo(true);
        } else {
          setPendingAdd({ sourceRecord, matches });
        }
        return;
      }

      if (command.key === "zoom-to") {
        if (!jimuMapView || itemKey == null) return;
        const record = selectedSourceRecords.find(
          (r) => r.getId() === String(itemKey),
        );
        if (!record) return;
        const rawGeo = record.getRawGeometry();
        if (!rawGeo) return;
        geometryUtils
          .convertGeometryJsonToGeometryInstance(rawGeo, false)
          .then((geo) => jimuMapView.view.goTo(geo))
          .catch((err) =>
            console.warn("[relationship-logger] zoom-to failed:", err),
          );
        return;
      }

      console.log(
        `[relationship-logger] command: ${command.key}, itemKey: ${itemKey}`,
      );
    },
    [
      jimuMapView,
      selectedSourceRecords,
      relatedRecordsByDs,
      relationships,
      onRemoveRelatedRecord,
      onAddRelatedRecord,
    ],
  );

  const handleExpandItem = useCallback(
    (actionData: TreeExpandItemActionDataType, refComponent: _TreeItem) => {
      const key = refComponent.props.itemJsons[0]?.itemKey;
      if (key) {
        setExpandedKeys((prev) => ({
          ...prev,
          [key]: actionData.itemStateExpanded,
        }));
      }
    },
    [],
  );

  const sourceLayerInfo = useMemo(() => {
    const layer = getFeatureLayer(firstDs);
    return {
      title: layer?.title ?? "Source Layer",
      displayField: layer?.displayField ?? null,
    };
  }, [firstDs]);

  const rootItemJson = useMemo<TreeItemType>(
    () => ({
      itemKey: "hidden-root",
      itemStateTitle: "",
      itemChildren: [
        {
          itemKey: "source-root",
          itemStateTitle: sourceLayerInfo.title,
          itemStateExpanded: expandedKeys["source-root"] ?? true,
          itemChildren: selectedSourceRecords.map((record) =>
            buildSourceRecordNode(
              record,
              sourceLayerInfo.displayField,
              relatedRecordsByDs?.[record.getId()] ?? {},
              relationships,
              expandedKeys,
              mapCommands,
            ),
          ),
        },
      ],
    }),
    [
      selectedSourceRecords,
      sourceLayerInfo,
      relatedRecordsByDs,
      relationships,
      expandedKeys,
      mapCommands,
    ],
  );

  return selectedSourceRecords.length === 0 ? null : (
    <div>
      <Tree
        treeAlignmentType={TreeAlignmentType.Intact}
        collapseStyle={TreeCollapseStyle.Arrow}
        dndEnabled={false}
        isMultiSelection={false}
        rootItemJson={rootItemJson}
        onExpandItem={handleExpandItem}
        onClickItemCommand={handleClickItemCommand}
      />
      {isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4px 0",
          }}
        >
          <Loading type={LoadingType.Secondary} width={16} height={16} />
        </div>
      )}
      {pendingRemoval && (
        <ConfirmDialog
          level="warning"
          title="Remove related record"
          content={`Remove \u201c${pendingRemoval.displayTitle}\u201d from this relationship?`}
          hasNotShowAgainOption={false}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={() => {
            onRemoveRelatedRecord?.(
              pendingRemoval.sourceRecord,
              pendingRemoval.targetRecord,
              pendingRemoval.relDef,
            );
            setPendingRemoval(null);
          }}
          onClose={() => setPendingRemoval(null)}
        />
      )}
      {pendingAdd && (
        <ConfirmDialog
          level="info"
          title="Add related record(s)"
          content={formatAddContent(pendingAdd)}
          hasNotShowAgainOption={false}
          confirmLabel="Add"
          cancelLabel="Cancel"
          onConfirm={() => {
            const { sourceRecord, matches } = pendingAdd;
            setPendingAdd(null);
            matches.forEach(({ relDef, targetRecords }) => {
              onAddRelatedRecord?.(sourceRecord, relDef, targetRecords)?.catch(
                (err) =>
                  console.error(
                    "[relationship-logger] Failed to add related record:",
                    err,
                  ),
              );
            });
          }}
          onClose={() => setPendingAdd(null)}
        />
      )}
      {noSelectionInfo && (
        <ConfirmDialog
          level="info"
          title="No records selected"
          content="Select records in a related layer first, then click the add button."
          hasNotShowAgainOption={false}
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() => setNoSelectionInfo(false)}
          onClose={() => setNoSelectionInfo(false)}
        />
      )}
    </div>
  );
}

import { useMemo, useState, useCallback } from "react";
import { DataRecord, React, type ArcGISQueriableDataSource } from "jimu-core";
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
import { Loading, LoadingType } from "jimu-ui";
import type { RelatedRecordsByDs } from "../types";
import PlusIcon from "jimu-icons/svg/outlined/editor/plus.svg";
import TrashIcon from "jimu-icons/svg/outlined/editor/trash.svg";

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
    ],
    itemChildren: relatedChildren,
  };
}

// ─── component ───────────────────────────────────────────────────────────────

interface RenderRelationshipsProps {
  selectedSourceRecords: DataRecord[];
  relatedRecordsByDs?: RelatedRecordsByDs;
  relationships?: RelationshipDefinition[];
  isLoading?: boolean;
}

export default function RenderRelationships(props: RenderRelationshipsProps) {
  const {
    selectedSourceRecords,
    relatedRecordsByDs,
    relationships = [],
    isLoading = false,
  } = props;
  const firstDs = selectedSourceRecords[0]?.dataSource ?? null;

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const handleClickItemCommand = useCallback(
    (actionData: CommandActionDataType, _refComponent: _TreeItem) => {
      const { command, data } = actionData as CommandActionDataType & {
        data?: { itemJsons?: TreeItemType[] };
      };
      const itemKey = data?.itemJsons?.[0]?.itemKey;
      console.log(
        `[relationship-logger] command: ${command.key}, itemKey: ${itemKey}`,
      );
    },
    [],
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
    </div>
  );
}

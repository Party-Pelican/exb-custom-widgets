import { DataSourceTypes, Immutable, React, UseDataSource } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig, type RelationshipDefinition } from "../config";
import {
  MapWidgetSelector,
  SettingSection,
  SettingRow,
  SidePopper,
} from "jimu-ui/advanced/setting-components";
import { DataSourceSelector } from "jimu-ui/advanced/data-source-selector";
import { Button } from "jimu-ui";
import { useRef, useState } from "react";
import RelationshipForm from "./relationship-form";

/** Collect all UseDataSource references across every configured relationship */
function getRelationshipDataSources(
  relationships: RelationshipDefinition[],
): UseDataSource[] {
  const result: UseDataSource[] = [];
  for (const rel of relationships) {
    result.push(rel.targetDataSource);
    if (rel.type === "junction-table") {
      result.push(rel.junctionDataSource);
    }
  }
  return result;
}

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRefs = useRef<HTMLButtonElement[]>([]);

  function openPopper(index: number | "new") {
    setEditingIndex(index);
  }

  function closePopper() {
    setEditingIndex(null);
  }

  const relationships: RelationshipDefinition[] = props.config.relationships
    ? props.config.relationships.asMutable({ deep: true })
    : [];

  function saveToConfig(updated: RelationshipDefinition[]) {
    const sourceDs = props.config.sourceData?.asMutable({ deep: true });
    props.onSettingChange({
      id: props.id,
      useDataSources: sourceDs
        ? [sourceDs, ...getRelationshipDataSources(updated)]
        : getRelationshipDataSources(updated),
      config: props.config.set("relationships", updated),
    });
  }

  function onSourceDataSourceChange(selected: UseDataSource[]) {
    const sourceDs = selected[0];
    props.onSettingChange({
      id: props.id,
      useDataSources: [sourceDs, ...getRelationshipDataSources(relationships)],
      config: props.config.set("sourceData", sourceDs),
    });
  }

  function handleSave(rel: RelationshipDefinition) {
    const updated = [...relationships];
    if (editingIndex === "new") {
      updated.push(rel);
    } else {
      updated[editingIndex as number] = rel;
    }
    saveToConfig(updated);
    closePopper();
  }

  function handleDelete(index: number) {
    const updated = relationships.filter((_, i) => i !== index);
    saveToConfig(updated);
  }

  const sourceDs = props.config.sourceData?.asMutable({ deep: true });

  return (
    <div>
      <SettingSection title="Map">
        <SettingRow flow="wrap">
          <MapWidgetSelector
            useMapWidgetIds={
              props.useMapWidgetIds?.length
                ? Immutable.from(props.useMapWidgetIds)
                : Immutable.from([])
            }
            onSelect={(ids) =>
              props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
            }
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Source Data Source">
        <p style={{ padding: "8px 0" }}>
          Select the layer to listen for selections on.
        </p>
        <SettingRow flow="wrap">
          <DataSourceSelector
            mustUseDataSource
            onChange={onSourceDataSourceChange}
            widgetId={props.id}
            types={Immutable.from([DataSourceTypes.FeatureLayer])}
            isMultiple={false}
            useDataSources={
              props.config.sourceData
                ? Immutable.from([props.config.sourceData])
                : Immutable.from([])
            }
            useDataSourcesEnabled={props.useDataSourcesEnabled}
          />
        </SettingRow>
      </SettingSection>

      {sourceDs && editingIndex === null && (
        <SettingSection title="Relationships">
          {relationships.length === 0 && (
            <SettingRow>
              <p style={{ color: "var(--ref-palette-neutral-1000)" }}>
                No relationships configured yet.
              </p>
            </SettingRow>
          )}
          {relationships.map((rel, i) => (
            <SettingRow key={i} label={rel.label}>
              <Button
                size="sm"
                ref={(el) => {
                  editButtonRefs.current[i] = el;
                }}
                onClick={() => openPopper(i)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                type="danger"
                className="ml-1"
                onClick={() => handleDelete(i)}
              >
                Delete
              </Button>
            </SettingRow>
          ))}
          <SettingRow>
            <Button ref={addButtonRef} onClick={() => openPopper("new")}>
              Add Relationship
            </Button>
          </SettingRow>
        </SettingSection>
      )}

      <SidePopper
        isOpen={editingIndex !== null}
        position="right"
        toggle={closePopper}
        trigger={
          editingIndex === "new"
            ? addButtonRef.current
            : editButtonRefs.current[editingIndex as number]
        }
        title={
          editingIndex === "new" ? "Add Relationship" : "Edit Relationship"
        }
        widgetId={props.id}
      >
        {sourceDs && editingIndex !== null && (
          <SettingSection>
            <RelationshipForm
              sourceDataSource={sourceDs}
              initial={
                editingIndex !== "new" ? relationships[editingIndex] : undefined
              }
              widgetId={props.id}
              onSave={handleSave}
              onCancel={closePopper}
            />
          </SettingSection>
        )}
      </SidePopper>
    </div>
  );
}

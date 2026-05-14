import { DataSourceTypes, Immutable, React, UseDataSource } from "jimu-core";
import {
  DataSourceSelector,
  FieldSelector,
} from "jimu-ui/advanced/data-source-selector";
import { SettingRow } from "jimu-ui/advanced/setting-components";
import { Button, Label, Option, Select, TextInput } from "jimu-ui";
import {
  type FieldRelate,
  type JunctionRelate,
  type RelationshipDefinition,
} from "../config";
import { useState } from "react";

interface RelationshipFormProps {
  /** The source datasource — used to populate source field pickers */
  sourceDataSource: UseDataSource;
  /** Existing relationship to edit, or null when adding new */
  initial?: RelationshipDefinition;
  widgetId: string;
  onSave: (rel: RelationshipDefinition) => void;
  onCancel: () => void;
}

const FEATURE_LAYER_TYPES = Immutable.from([DataSourceTypes.FeatureLayer]);
const EMPTY_DS = Immutable.from<UseDataSource[]>([]);

export default function RelationshipForm({
  sourceDataSource,
  initial,
  widgetId,
  onSave,
  onCancel,
}: RelationshipFormProps) {
  const [type, setType] = useState<RelationshipDefinition["type"]>(
    initial?.type ?? "field-relate",
  );
  const [label, setLabel] = useState(initial?.label ?? "");
  const [sourceField, setSourceField] = useState(initial?.sourceField ?? "");

  // field-relate state
  const [targetDs, setTargetDs] = useState<UseDataSource | null>(
    initial?.targetDataSource ?? null,
  );
  const [targetField, setTargetField] = useState(
    initial ? initial.targetField : "",
  );

  // junction-table state
  const [junctionDs, setJunctionDs] = useState<UseDataSource | null>(
    initial?.type === "junction-table" ? initial.junctionDataSource : null,
  );
  const [junctionSourceField, setJunctionSourceField] = useState(
    initial?.type === "junction-table" ? initial.junctionSourceField : "",
  );
  const [junctionTargetField, setJunctionTargetField] = useState(
    initial?.type === "junction-table" ? initial.junctionTargetField : "",
  );

  function isValid(): boolean {
    if (!label.trim() || !sourceField) return false;
    if (type === "field-relate") {
      return !!targetDs && !!targetField;
    }
    return (
      !!junctionDs &&
      !!junctionSourceField &&
      !!junctionTargetField &&
      !!targetDs &&
      !!targetField
    );
  }

  function handleSave() {
    if (!isValid()) return;
    if (type === "field-relate") {
      onSave({
        type: "field-relate",
        label,
        sourceField,
        targetDataSource: targetDs!,
        targetField,
      } satisfies FieldRelate);
    } else {
      onSave({
        type: "junction-table",
        label,
        sourceField,
        junctionDataSource: junctionDs!,
        junctionSourceField,
        junctionTargetField,
        targetDataSource: targetDs!,
        targetField,
      } satisfies JunctionRelate);
    }
  }

  return (
    <div>
      <SettingRow label="Label" tag="label" flow="wrap">
        <TextInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Related Permits"
        />
      </SettingRow>

      <SettingRow label="Type" tag="label" flow="wrap">
        <Select
          value={type}
          onChange={(e) =>
            setType(e.target.value as RelationshipDefinition["type"])
          }
        >
          <Option value="field-relate">Field Relate</Option>
          <Option value="junction-table">Junction Table</Option>
        </Select>
      </SettingRow>

      <SettingRow label="Source field" tag="label" flow="wrap">
        <FieldSelector
          useDataSources={Immutable.from([sourceDataSource])}
          selectedFields={
            sourceField ? Immutable.from([sourceField]) : Immutable.from([])
          }
          isDataSourceDropDownHidden
          useDropdown
          widgetId={widgetId}
          onChange={(fields) => setSourceField(fields[0]?.jimuName ?? "")}
        />
      </SettingRow>

      {type === "junction-table" && (
        <>
          <SettingRow label="Junction layer" tag="label" flow="wrap">
            <DataSourceSelector
              mustUseDataSource
              types={FEATURE_LAYER_TYPES}
              isMultiple={false}
              widgetId={widgetId}
              useDataSources={
                junctionDs ? Immutable.from([junctionDs]) : EMPTY_DS
              }
              onChange={(selected) => {
                setJunctionDs(selected[0] ?? null);
                setJunctionSourceField("");
                setJunctionTargetField("");
              }}
            />
          </SettingRow>

          {junctionDs && (
            <>
              <SettingRow
                label="Junction → source field"
                tag="label"
                flow="wrap"
              >
                <FieldSelector
                  useDataSources={Immutable.from([junctionDs])}
                  selectedFields={
                    junctionSourceField
                      ? Immutable.from([junctionSourceField])
                      : Immutable.from([])
                  }
                  isDataSourceDropDownHidden
                  useDropdown
                  widgetId={widgetId}
                  onChange={(fields) =>
                    setJunctionSourceField(fields[0]?.jimuName ?? "")
                  }
                />
              </SettingRow>

              <SettingRow
                label="Junction → target field"
                tag="label"
                flow="wrap"
              >
                <FieldSelector
                  useDataSources={Immutable.from([junctionDs])}
                  selectedFields={
                    junctionTargetField
                      ? Immutable.from([junctionTargetField])
                      : Immutable.from([])
                  }
                  isDataSourceDropDownHidden
                  useDropdown
                  widgetId={widgetId}
                  onChange={(fields) =>
                    setJunctionTargetField(fields[0]?.jimuName ?? "")
                  }
                />
              </SettingRow>
            </>
          )}
        </>
      )}

      <SettingRow label="Target layer" flow="wrap">
        <DataSourceSelector
          mustUseDataSource
          types={FEATURE_LAYER_TYPES}
          isMultiple={false}
          widgetId={widgetId}
          useDataSources={targetDs ? Immutable.from([targetDs]) : EMPTY_DS}
          onChange={(selected) => {
            setTargetDs(selected[0] ?? null);
            setTargetField("");
          }}
        />
      </SettingRow>

      {targetDs && (
        <SettingRow label="Target field" tag="label" flow="wrap">
          <FieldSelector
            useDataSources={Immutable.from([targetDs])}
            selectedFields={
              targetField ? Immutable.from([targetField]) : Immutable.from([])
            }
            isDataSourceDropDownHidden
            useDropdown
            widgetId={widgetId}
            onChange={(fields) => setTargetField(fields[0]?.jimuName ?? "")}
          />
        </SettingRow>
      )}

      <SettingRow>
        <Button type="primary" disabled={!isValid()} onClick={handleSave}>
          Save
        </Button>
        <Button className="ml-2" onClick={onCancel}>
          Cancel
        </Button>
      </SettingRow>
    </div>
  );
}

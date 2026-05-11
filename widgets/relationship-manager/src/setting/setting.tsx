import {
  DataSourceManager,
  DataSourceTypes,
  Immutable,
  React,
  UseDataSource,
} from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type Config, type IMConfig, type RelationshipRule } from "../config";
import {
  MapWidgetSelector,
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { DataSourceSelector } from "jimu-ui/advanced/data-source-selector";
import { Label, Select, Option, Button, TextInput } from "jimu-ui";

type FieldOption = { value: string; label: string; type?: string };

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createRule = (): RelationshipRule => ({
  id: createId(),
  sourceUseDataSource: undefined,
  sourceDataSourceId: "",
  sourceDataSourceField: "",
  targetDataSourceField: "",
});

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const cfg = props.config;
  const rules = (cfg?.rules ?? []) as RelationshipRule[];

  // ── field helpers ──────────────────────────────────────────────────────────

  const getFields = (dataSourceId?: string): FieldOption[] => {
    if (!dataSourceId) return [];
    const ds = DataSourceManager.getInstance().getDataSource(dataSourceId);
    const fields = Object.values(ds?.getSchema()?.fields ?? {}) as any[];
    return fields
      .map((f) => {
        const value = f?.name || f?.jimuName || "";
        if (!value) return null;
        const display = f?.alias || f?.name || f?.jimuName || value;
        return { value, label: display, type: f?.type as string | undefined };
      })
      .filter((f) => f !== null && Boolean(f?.value))
      .sort((a, b) =>
        (a as FieldOption).label.localeCompare((b as FieldOption).label),
      ) as FieldOption[];
  };

  const getFieldType = (
    dsId: string | undefined,
    fieldName: string | undefined,
  ): string | undefined => {
    if (!dsId || !fieldName) return undefined;
    return getFields(dsId).find((f) => f.value === fieldName)?.type;
  };

  // ── useDataSources aggregation ─────────────────────────────────────────────

  const getAllUseDataSources = (
    cfgOverrides: Partial<Config>,
    nextRules: RelationshipRule[],
  ): UseDataSource[] => {
    const map = new Map<string, UseDataSource>();
    const add = (uds?: UseDataSource) => {
      if (uds?.dataSourceId) map.set(uds.dataSourceId, uds);
    };
    add(
      (cfgOverrides.intermediateUseDataSource ??
        cfg?.intermediateUseDataSource) as unknown as UseDataSource | undefined,
    );
    nextRules.forEach((r) => add(r.sourceUseDataSource));
    return Array.from(map.values());
  };

  // ── update helpers ─────────────────────────────────────────────────────────

  const updateConfig = (updates: Partial<Config>) => {
    props.onSettingChange({
      id: props.id,
      config: cfg.merge(updates as any),
      useDataSources: getAllUseDataSources(updates, rules),
    });
  };

  const updateRules = (nextRules: RelationshipRule[]) => {
    props.onSettingChange({
      id: props.id,
      config: cfg.set("rules", nextRules),
      useDataSources: getAllUseDataSources({}, nextRules),
    });
  };

  const updateRule = (ruleId: string, updates: Partial<RelationshipRule>) =>
    updateRules(rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));

  const addRule = () => updateRules([...rules, createRule()]);
  const removeRule = (ruleId: string) =>
    updateRules(rules.filter((r) => r.id !== ruleId));

  const updateStepperTitle = (dsId: string, title: string) => {
    const current = (cfg?.stepperTitles ?? {}) as Record<string, string>;
    props.onSettingChange({
      id: props.id,
      config: cfg.set("stepperTitles", { ...current, [dsId]: title }),
      useDataSources: getAllUseDataSources({}, rules),
    });
  };

  const updateNoSelectionMessage = (dsId: string, message: string) => {
    const current = (cfg?.noSelectionMessages ?? {}) as Record<string, string>;
    props.onSettingChange({
      id: props.id,
      config: cfg.set("noSelectionMessages", { ...current, [dsId]: message }),
      useDataSources: getAllUseDataSources({}, rules),
    });
  };

  const updateSelectionMode = (dsId: string, mode: "one" | "many") => {
    const current = (cfg?.sourceSelectionModes ?? {}) as Record<
      string,
      "one" | "many"
    >;
    props.onSettingChange({
      id: props.id,
      config: cfg.set("sourceSelectionModes", { ...current, [dsId]: mode }),
      useDataSources: getAllUseDataSources({}, rules),
    });
  };

  // Unique source datasources in rule order (for selection-mode display)
  const uniqueSourceDatasources = (() => {
    const seen = new Set<string>();
    const result: { dsId: string; label: string }[] = [];
    rules.forEach((r) => {
      if (r.sourceDataSourceId && !seen.has(r.sourceDataSourceId)) {
        seen.add(r.sourceDataSourceId);
        const ds = DataSourceManager.getInstance().getDataSource(
          r.sourceDataSourceId,
        ) as any;
        const label = ds?.layer?.title ?? ds?.label ?? r.sourceDataSourceId;
        result.push({ dsId: r.sourceDataSourceId, label });
      }
    });
    return result;
  })();

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── 1. Map ──────────────────────────────────────────────────────────── */}
      <SettingSection title="Map">
        <MapWidgetSelector
          useMapWidgetIds={props.useMapWidgetIds}
          onSelect={(ids) =>
            props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
          }
        />
      </SettingSection>

      {/* ── 2. Intermediate table ───────────────────────────────────────────── */}
      <SettingSection title="Intermediate table">
        <SettingRow>
          <Label>
            Select the M:N relationship table that will receive new rows.
          </Label>
        </SettingRow>
        <DataSourceSelector
          mustUseDataSource
          onChange={(selected) => {
            const uds = selected?.[0];
            updateConfig({
              intermediateUseDataSource: uds,
              intermediateDataSourceId: uds?.dataSourceId ?? "",
              rules: [],
            });
          }}
          widgetId={props.id}
          types={Immutable.from([DataSourceTypes.FeatureLayer])}
          useDataSources={Immutable.from(
            cfg?.intermediateUseDataSource
              ? [cfg.intermediateUseDataSource as unknown as UseDataSource]
              : [],
          )}
        />
      </SettingSection>

      {/* ── 3. Field mapping rules ──────────────────────────────────────────── */}
      <SettingSection title="Field mapping rules">
        <SettingRow>
          <Label>
            Each rule copies a field value from a source datasource into the
            intermediate table.
          </Label>
        </SettingRow>
        <SettingRow>
          <Button onClick={addRule} disabled={!cfg?.intermediateDataSourceId}>
            Add Rule
          </Button>
        </SettingRow>

        {rules.map((rule, ruleIndex) => {
          const sourceFields = getFields(rule.sourceDataSourceId);
          const sourceFieldType = getFieldType(
            rule.sourceDataSourceId,
            rule.sourceDataSourceField,
          );
          const targetFields = getFields(cfg?.intermediateDataSourceId).filter(
            (f) => !sourceFieldType || f.type === sourceFieldType,
          );

          return (
            <div
              key={rule.id}
              style={{
                border: "1px solid #d7d7d7",
                borderRadius: "4px",
                padding: "0.75rem",
                marginBottom: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <SettingRow>
                <Label>{`Rule ${ruleIndex + 1}`}</Label>
                <Button
                  onClick={() => removeRule(rule.id)}
                  style={{ marginLeft: "auto" }}
                >
                  Remove
                </Button>
              </SettingRow>

              <Label>Source datasource</Label>
              <DataSourceSelector
                mustUseDataSource
                onChange={(selected) => {
                  const uds = selected?.[0];
                  updateRule(rule.id, {
                    sourceUseDataSource: uds,
                    sourceDataSourceId: uds?.dataSourceId ?? "",
                    sourceDataSourceField: "",
                    targetDataSourceField: "",
                  });
                }}
                widgetId={props.id}
                types={Immutable.from([DataSourceTypes.FeatureLayer])}
                useDataSources={Immutable.from(
                  rule.sourceUseDataSource ? [rule.sourceUseDataSource] : [],
                )}
              />

              <Label>Source field</Label>
              <Select
                value={rule.sourceDataSourceField || ""}
                disabled={!rule.sourceDataSourceId}
                onChange={(e) =>
                  updateRule(rule.id, {
                    sourceDataSourceField: String(e.target.value),
                    targetDataSourceField: "",
                  })
                }
              >
                <Option value="">Select field</Option>
                {sourceFields.map((f) => (
                  <Option key={f.value} value={f.value}>
                    {f.label}
                  </Option>
                ))}
              </Select>

              <Label>
                {`Target field (intermediate table${sourceFieldType ? ` — type: ${sourceFieldType}` : ""})`}
              </Label>
              <Select
                value={rule.targetDataSourceField || ""}
                disabled={!rule.sourceDataSourceField}
                onChange={(e) =>
                  updateRule(rule.id, {
                    targetDataSourceField: String(e.target.value),
                  })
                }
              >
                <Option value="">Select field</Option>
                {targetFields.map((f) => (
                  <Option key={f.value} value={f.value}>
                    {f.label}
                  </Option>
                ))}
              </Select>
            </div>
          );
        })}
      </SettingSection>

      {/* ── 4. Stepper step titles ───────────────────────────────────────────── */}
      {uniqueSourceDatasources.length > 0 && (
        <SettingSection title="Step titles">
          <SettingRow>
            <Label>
              Customize the heading and no-selection message shown for each
              step. Leave blank to use the defaults.
            </Label>
          </SettingRow>
          {uniqueSourceDatasources.map(({ dsId, label }) => {
            const customTitle =
              ((cfg?.stepperTitles as unknown as Record<string, string>) ?? {})[
                dsId
              ] ?? "";
            const customMessage =
              ((cfg?.noSelectionMessages as unknown as Record<
                string,
                string
              >) ?? {})[dsId] ?? "";
            return (
              <div
                key={dsId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  marginBottom: "0.75rem",
                }}
              >
                <Label style={{ margin: 0 }}>{label} — Step title</Label>
                <TextInput
                  placeholder={label}
                  value={customTitle}
                  onChange={(e) => updateStepperTitle(dsId, e.target.value)}
                />
                <Label style={{ margin: 0 }}>
                  {label} — No-selection message
                </Label>
                <TextInput
                  placeholder={`Select a feature from ${label}.`}
                  value={customMessage}
                  onChange={(e) =>
                    updateNoSelectionMessage(dsId, e.target.value)
                  }
                />
              </div>
            );
          })}
        </SettingSection>
      )}

      {/* ── 5. Source layer selection mode ──────────────────────────────────── */}
      {uniqueSourceDatasources.length > 0 && (
        <SettingSection title="Source layer selection mode">
          <SettingRow>
            <Label>
              Choose whether each source layer contributes one record (first
              selected) or all selected records when creating rows in the
              intermediate table.
            </Label>
          </SettingRow>
          {uniqueSourceDatasources.map(({ dsId, label }) => {
            const mode =
              (
                cfg?.sourceSelectionModes as unknown as Record<
                  string,
                  "one" | "many"
                >
              )?.[dsId] ?? "many";
            return (
              <div
                key={dsId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Label style={{ flex: 1, margin: 0 }}>{label}</Label>
                <Select
                  value={mode}
                  style={{ width: "8rem" }}
                  onChange={(e) =>
                    updateSelectionMode(dsId, e.target.value as "one" | "many")
                  }
                >
                  <Option value="many">Many (all selected)</Option>
                  <Option value="one">One (first selected)</Option>
                </Select>
              </div>
            );
          })}
        </SettingSection>
      )}
    </>
  );
}

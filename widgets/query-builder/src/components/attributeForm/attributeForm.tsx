import {
  ClauseLogic,
  DataSource,
  DataSourceManager,
  FeatureLayerDataSource,
  FieldSchema,
  Immutable,
  IMSqlExpression,
  QueryScope,
  React,
  SqlClause,
  SqlExpressionMode,
  ReactDOM,
} from "jimu-core";
import { useEffect, useRef, useState } from "react";
import {
  TextInput,
  Select,
  Option,
  Button,
  Checkbox,
  Label,
  Icon,
  NumericInput,
  Progress,
  Switch,
} from "jimu-ui";
import deleteIcon from "../../runtime/assets/x-24.svg";
import { DatePicker } from "jimu-ui/basic/date-picker";
import SQLForm from "../sqlForm/sqlForm";
import { SqlExpressionBuilder } from "jimu-ui/advanced/sql-expression-builder";

type AttributeFormProps = {
  featureLayerDataSources: FeatureLayerDataSource[];
  widgetId: string;
  toggleDialog: () => void;
};

const stringOperators = ["=", "!=", "LIKE"];
const numberOperators = ["=", "!=", ">", "<", ">=", "<="];
const dateOperators = ["=", "!=", ">", "<"];
const defaultOperators = ["="];

function getOperatorsForField(fieldType: string) {
  switch (fieldType) {
    case "esriFieldTypeString":
      return stringOperators;
    case "esriFieldTypeInteger":
    case "esriFieldTypeDouble":
    case "esriFieldTypeSingle":
    case "esriFieldTypeOID":
      return numberOperators;
    case "esriFieldTypeDate":
      return dateOperators;
    default:
      return defaultOperators;
  }
}

function getValueInput(fieldType, value, onChange) {
  switch (fieldType) {
    case "esriFieldTypeDate":
      return (
        <DatePicker
          runtime
          selectedDate={value ? new Date(value) : null}
          onChange={(val) => onChange(val)}
        />
      );
    case "esriFieldTypeInteger":
    case "esriFieldTypeDouble":
    case "esriFieldTypeSingle":
      return <NumericInput value={value} onChange={(val) => onChange(val)} />;
    default:
      return (
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} />
      );
  }
}

function formatDate(epochTime) {
  const date = new Date(epochTime);
  const pad = (n) => (n < 10 ? "0" + n : n);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Month is 0-indexed
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function AttributeForm({
  featureLayerDataSources,
  widgetId,
  toggleDialog,
}: AttributeFormProps) {
  const [inputLayer, setInputLayer] = useState("");
  const [selectionType, setSelectionType] = useState("new");
  const [clauses, setClauses] = useState([
    { field: "", operator: "", value: "", logic: "AND" },
  ]);
  const [invertWhere, setInvertWhere] = useState(false);
  const [fields, setFields] = useState<FieldSchema[]>([]);
  const [selectedDataSource, setSelectedDataSource] =
    useState<FeatureLayerDataSource>(null);
  const [selectionProgress, setSelectionProgress] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [useSQL, setUseSQL] = useState(false);
  const [sql, setSQL] = useState<IMSqlExpression>({} as IMSqlExpression);
  const currentControllerRef = useRef<AbortController | null>(null);

  const handleClauseChange = (index, key, value) => {
    const updated = [...clauses];
    updated[index][key] = value;
    if (key === "field") {
      updated[index]["value"] = ""; // Reset value when field changes
    }
    setClauses(updated);
  };

  const addClause = () => {
    setClauses([
      ...clauses,
      { field: "", operator: "", value: "", logic: "AND" },
    ]);
  };

  const removeClause = (index) => {
    setClauses(clauses.filter((_, i) => i !== index));
  };

  const updateClause = (index, key, value) => {
    const updated = [...clauses];
    updated[index][key] = value;
    setClauses(updated);
  };

  function handleInputLayerChange(_, inputLayerId) {
    setInputLayer(inputLayerId);
    setClauses([{ field: "", operator: "", value: "", logic: "AND" }]);
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
    console.log("Selected data source:", selectedDataSource);

    const inputLayerSchema = featureLayerDataSources
      .find((flds) => flds.id === inputLayerId)
      .getSchema();
    const fields = Object.values(inputLayerSchema.fields);

    setFields(fields.map((field) => field.asMutable({ deep: true })));
  }

  async function executeSelection() {
    if (!selectedDataSource) return;

    let whereClause = clauses
      .map((clause, index) => {
        let value = clause.value;

        if (
          fields.find((field) => field.name === clause.field)?.esriType ===
          "esriFieldTypeDate"
        ) {
          value = `DATE '${formatDate(value)}'`;
        } else if (
          fields.find((field) => field.name === clause.field)?.esriType ===
          "esriFieldTypeString"
        ) {
          value = `'${value}'`;
        }

        const expression = `${clause.field} ${clause.operator} ${value}`;
        return index === 0 ? expression : `${clause.logic} ${expression}`;
      })
      .join(" ");

    if (invertWhere) {
      whereClause = `NOT (${whereClause})`;
    }

    try {
      // Cancel previous query if it's still running
      if (currentControllerRef.current) {
        currentControllerRef.current.abort();
      }
      setIsLoading(true);

      currentControllerRef.current = new AbortController();

      await selectedDataSource.selectRecords(
        {
          queryParams: {
            where: whereClause,
          },
          widgetId: widgetId,
        },
        currentControllerRef.current.signal,
        (progress) => setSelectionProgress(progress)
      );
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Previous query aborted.");
      } else {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setSelectionProgress(null);
    }
  }

  return (
    <div
      className="d-flex flex-column p-2"
      style={{
        gap: "0.5rem",
        maxHeight: "50vh",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Input Rows */}

      <Select
        value={inputLayer}
        onChange={handleInputLayerChange}
        placeholder="Input Rows"
      >
        {featureLayerDataSources.map((flds) => (
          <Option key={flds.id} value={flds.id}>
            {flds.layer.title}
          </Option>
        ))}
      </Select>

      {/* Selection Type */}

      <Select
        value={selectionType}
        onChange={(e) => setSelectionType(e.target.value)}
        placeholder="Selection Type"
      >
        <Option value="new">New selection</Option>

        {
          // I dont know how to implement these options yet
          /* <Option value="add">Add to selection</Option>
        <Option value="remove">Remove from selection</Option>
        <Option value="intersect">Select from current selection</Option> */
        }
      </Select>

      {/* Expression Area */}
      <div className="d-flex justify-content-between">
        <Label>Expression</Label>
        <Label>
          SQL
          <Switch
            className="ml-2"
            checked={useSQL}
            onChange={() => setUseSQL((prevState) => !prevState)}
          ></Switch>
        </Label>
      </div>

      {/* Clause Builder */}
      {useSQL ? (
        <SQLForm fieldsIndex={selectedDataSource?.layer.fieldsIndex} />
      ) : (
        clauses.map((clause, index) => (
          <div
            key={index}
            style={{ gap: "2px" }}
            className="d-flex align-items-center flex-nowrap w-100"
          >
            {index > 0 && (
              <Select
                value={clause.logic}
                onChange={(e) => updateClause(index, "logic", e.target.value)}
              >
                <Option value="AND">AND</Option>
                <Option value="OR">OR</Option>
              </Select>
            )}

            <Select
              value={clause.field}
              onChange={(e) =>
                handleClauseChange(index, "field", e.target.value)
              }
              placeholder="Field"
            >
              {/* Replace with real fields */}
              {fields
                .filter(
                  (field) =>
                    !clauses
                      .map((c, i) => (i !== index ? c.field : null))
                      .includes(field.name)
                )
                .map((field) => (
                  <Option key={field.name} value={field.name}>
                    {field.name}
                  </Option>
                ))}
            </Select>

            <Select
              value={clause.operator}
              onChange={(e) =>
                handleClauseChange(index, "operator", e.target.value)
              }
              placeholder="Operator"
            >
              {getOperatorsForField(
                fields.find((field) => field.name == clause.field)?.esriType ||
                  ""
              ).map((operator) => (
                <Option key={operator} value={operator}>
                  {operator}
                </Option>
              ))}
            </Select>

            {getValueInput(
              fields.find((field) => field.name == clause.field)?.esriType ||
                "",
              clause.value,
              (e) =>
                handleClauseChange(
                  index,
                  "value",
                  e?.target?.value !== undefined ? e.target.value : e
                )
            )}

            {index > 0 && (
              <Button icon type="tertiary" onClick={() => removeClause(index)}>
                <Icon icon={deleteIcon} color="red" />
              </Button>
            )}
          </div>
        ))
      )}

      {!useSQL && (
        <Button type="tertiary" onClick={addClause}>
          + Add Clause
        </Button>
      )}

      <Label>
        <Checkbox
          checked={invertWhere}
          onChange={(e) => setInvertWhere(e.target.checked)}
          className="mr-2"
        ></Checkbox>
        Invert Where Clause
      </Label>

      {/* Action buttons */}
      <div className="d-flex justify-content-end" style={{ gap: "0.5rem" }}>
        <Button
          onClick={() => {
            setIsLoading(false);
            setSelectionProgress(null);
            currentControllerRef.current?.abort();
          }}
        >
          Cancel
        </Button>
        <Button onClick={executeSelection}>Apply</Button>
        <Button
          type="primary"
          onClick={() => {
            executeSelection();
            toggleDialog();
          }}
        >
          OK
        </Button>
      </div>
      <div>
        {isLoading && (
          <Progress
            color="primary"
            type="linear"
            value={Math.round((selectionProgress ?? 0) * 100)}
          />
        )}
      </div>
    </div>
  );
}

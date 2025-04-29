import {
  DataSourceManager,
  FeatureLayerDataSource,
  IMSqlExpression,
  React,
  SqlExpressionMode,
} from "jimu-core";
import { useEffect, useRef, useState } from "react";
import { Select, Option, Button, Label, Progress, Switch } from "jimu-ui";
import SQLForm from "../sqlForm/sqlForm";
import { SqlExpressionBuilder } from "jimu-ui/advanced/sql-expression-builder";

type AttributeFormProps = {
  featureLayerDataSources: FeatureLayerDataSource[];
  widgetId: string;
  toggleDialog: () => void;
};

export default function AttributeForm({
  featureLayerDataSources,
  widgetId,
  toggleDialog,
}: AttributeFormProps) {
  const [inputLayer, setInputLayer] = useState(null);
  const [selectionType, setSelectionType] = useState("new");
  const [selectedDataSource, setSelectedDataSource] = useState<
    FeatureLayerDataSource | undefined
  >(null);
  const [selectionProgress, setSelectionProgress] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [useSQL, setUseSQL] = useState(false);
  const [sql, setSQL] = useState<string | null>(null);
  const currentControllerRef = useRef<AbortController | null>(null);

  function handleInputLayerChange(_, inputLayerId) {
    setInputLayer(inputLayerId);
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }

  function handleSqlChange(sqlExprObj: IMSqlExpression) {
    setSQL(sqlExprObj.sql);
  }

  function cancelCurrentSelection() {
    currentControllerRef.current?.abort();
  }

  async function executeSelection() {
    if (!selectedDataSource) return;

    try {
      // Cancel previous query if it's still running
      if (currentControllerRef.current) {
        cancelCurrentSelection();
      }
      setIsLoading(true);

      currentControllerRef.current = new AbortController();

      await selectedDataSource.selectRecords(
        {
          queryParams: {
            where: sql,
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

  useEffect(() => {
    setInputLayer(featureLayerDataSources[0].id);
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      featureLayerDataSources[0].id
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }, []);

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
            onChange={(e) => setUseSQL(e.target.checked)}
          ></Switch>
        </Label>
      </div>

      {/* Clause Builder */}
      {useSQL ? (
        <SQLForm
          fieldsIndex={selectedDataSource?.layer.fieldsIndex}
          updateSQL={setSQL}
        />
      ) : (
        <div style={{ height: "200px" }}>
          <SqlExpressionBuilder
            mode={SqlExpressionMode.Simple}
            dataSource={selectedDataSource ?? featureLayerDataSources[0]}
            widgetId={widgetId}
            expression={null}
            onChange={handleSqlChange}
          ></SqlExpressionBuilder>
        </div>
      )}

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

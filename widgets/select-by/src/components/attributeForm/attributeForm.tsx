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
  const [inputLayer, setInputLayer] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<
    "new" | "add" | "remove" | "intersect"
  >("new");
  const [selectedDataSource, setSelectedDataSource] =
    useState<FeatureLayerDataSource | null>(null);
  const [selectionProgress, setSelectionProgress] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [useSQL, setUseSQL] = useState(false);
  const [sql, setSQL] = useState<string | null>(null);
  const [isSqlValid, setIsSqlValid] = useState(true);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [resultStatus, setResultStatus] = useState<
    "none" | "success" | "warning" | "error"
  >("none");
  const currentControllerRef = useRef<AbortController | null>(null);

  function handleInputLayerChange(_: unknown, inputLayerId: string) {
    setInputLayer(inputLayerId);
    setResultMessage("");
    setResultStatus("none");
    const selectedDataSource = DataSourceManager.getInstance().getDataSource(
      inputLayerId,
    ) as FeatureLayerDataSource;
    setSelectedDataSource(selectedDataSource);
  }

  function handleSqlChange(sqlExprObj: IMSqlExpression) {
    setSQL(sqlExprObj.sql);
    setIsSqlValid(true);
    setResultMessage("");
    setResultStatus("none");
  }

  function handleSqlValidityChange(isValid: boolean) {
    setIsSqlValid(isValid);
    if (!isValid) {
      setResultMessage("");
      setResultStatus("none");
    }
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
      return `Selection failed: ${err.message}`;
    }

    return "Selection failed. Please try again.";
  }

  function applySelectionMode(
    dataSource: FeatureLayerDataSource,
    queriedIds: string[],
    mode: "new" | "add" | "remove" | "intersect",
  ): number {
    const currentSelectedIds = dataSource.getSelectedRecordIds() ?? [];
    let nextSelectedIds: string[] = queriedIds;

    if (mode === "add") {
      nextSelectedIds = Array.from(
        new Set([...currentSelectedIds, ...queriedIds]),
      );
    } else if (mode === "remove") {
      const queriedSet = new Set(queriedIds);
      nextSelectedIds = currentSelectedIds.filter((id) => !queriedSet.has(id));
    } else if (mode === "intersect") {
      const queriedSet = new Set(queriedIds);
      nextSelectedIds = currentSelectedIds.filter((id) => queriedSet.has(id));
    }

    dataSource.selectRecordsByIds(nextSelectedIds);
    return nextSelectedIds.length;
  }

  async function executeSelection() {
    if (!selectedDataSource || (useSQL && (!sql || !isSqlValid))) return;

    try {
      // Cancel previous query if it's still running
      if (currentControllerRef.current) {
        currentControllerRef.current.abort();
      }
      setIsLoading(true);
      setResultMessage("");
      setResultStatus("none");

      currentControllerRef.current = new AbortController();

      const queryParams = {
        where: sql || "1=1",
      };

      if (selectionType === "new") {
        const queryResult = await selectedDataSource.selectRecords(
          {
            queryParams,
            widgetId: widgetId,
          },
          currentControllerRef.current.signal,
          (progress) => setSelectionProgress(progress),
        );

        const matchedCount =
          queryResult?.ids?.length ??
          queryResult?.records?.length ??
          queryResult?.count ??
          0;
        const selectedCount = selectedDataSource.getSelectedRecordIds().length;
        setResultMessage(
          matchedCount === 0
            ? "0 matching records"
            : `Matched ${matchedCount} records. Selected ${selectedCount}.`,
        );
        setResultStatus(matchedCount === 0 ? "warning" : "success");
      } else {
        const queryResult = await selectedDataSource.queryIds(queryParams, {
          widgetId,
        });
        const matchedCount = queryResult.ids?.length ?? 0;
        const selectedCount = applySelectionMode(
          selectedDataSource,
          queryResult.ids ?? [],
          selectionType,
        );
        setResultMessage(
          matchedCount === 0
            ? "0 matching records"
            : `Matched ${matchedCount} records. Selected ${selectedCount}.`,
        );
        setResultStatus(matchedCount === 0 ? "warning" : "success");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      } else {
        setResultMessage(getErrorMessage(err));
        setResultStatus("error");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setSelectionProgress(null);
    }
  }

  useEffect(() => {
    if ((featureLayerDataSources?.length ?? 0) === 0) {
      setInputLayer(null);
      setSelectedDataSource(null);
      setResultMessage("");
      setResultStatus("none");
      return;
    }

    const defaultId = featureLayerDataSources[0].id;
    setInputLayer(defaultId);
    const defaultDataSource = DataSourceManager.getInstance().getDataSource(
      defaultId,
    ) as FeatureLayerDataSource;
    setSelectedDataSource(defaultDataSource);
  }, [featureLayerDataSources]);

  useEffect(() => {
    return () => {
      currentControllerRef.current?.abort();
    };
  }, []);

  const canSubmit =
    !!selectedDataSource && !isLoading && (!useSQL || (!!sql && isSqlValid));

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
      {/* Input Layer */}

      <Select
        value={inputLayer}
        onChange={handleInputLayerChange}
        placeholder="Input Layer"
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
        onChange={(e) => {
          setSelectionType(
            e.target.value as "new" | "add" | "remove" | "intersect",
          );
          setResultMessage("");
          setResultStatus("none");
        }}
        placeholder="Selection Type"
      >
        <Option value="new">New selection</Option>
        <Option value="add">Add to selection</Option>
        <Option value="remove">Remove from selection</Option>
        <Option value="intersect">Select from current selection</Option>
      </Select>

      {/* Expression Area */}
      <div className="d-flex justify-content-between">
        <Label>Expression</Label>
        <Label>
          SQL
          <Switch
            className="ml-2"
            checked={useSQL}
            onChange={(e) => {
              setUseSQL(e.target.checked);
              setResultMessage("");
              setResultStatus("none");
            }}
          ></Switch>
        </Label>
      </div>

      {/* Clause Builder */}
      {useSQL ? (
        <SQLForm
          fieldsIndex={selectedDataSource?.layer.fieldsIndex}
          updateSQL={setSQL}
          onValidityChange={handleSqlValidityChange}
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
            setResultMessage("");
            setResultStatus("none");
            currentControllerRef.current?.abort();
            toggleDialog();
          }}
        >
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={executeSelection}>
          Apply
        </Button>
        <Button
          type="primary"
          disabled={!canSubmit}
          onClick={async () => {
            await executeSelection();
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
        {resultMessage && !isLoading && (
          <div
            className={
              resultStatus === "warning"
                ? "text-warning"
                : resultStatus === "success"
                  ? "text-success"
                  : resultStatus === "error"
                    ? "text-danger"
                    : "text-muted"
            }
          >
            {resultMessage}
          </div>
        )}
      </div>
    </div>
  );
}

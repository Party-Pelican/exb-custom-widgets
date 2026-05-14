import { DataRecord, React } from "jimu-core";
import { type JimuMapView } from "jimu-arcgis";
import { createContext, useContext, useState } from "react";
import { type RelationshipDefinition } from "../config";

export interface RelationshipResult {
  relationship: RelationshipDefinition;
  features: __esri.Graphic[];
  loading: boolean;
  error: string | null;
}

export interface WidgetContextValue {
  /** The active JimuMapView from the connected map widget */
  jimuMapView: JimuMapView | null;
  setJimuMapView: (view: JimuMapView | null) => void;

  /** Object IDs of the currently selected source features */
  selectedDataRecords: DataRecord[];
  setSelectedDataRecords: (records: DataRecord[]) => void;

  /** Query results keyed by relationship index */
  results: Record<number, RelationshipResult>;
  setResult: (index: number, result: RelationshipResult) => void;
  clearResults: () => void;

  /** Which relationship panel is currently expanded, null = all collapsed */
  activeRelationshipIndex: number | null;
  setActiveRelationshipIndex: (index: number | null) => void;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function WidgetContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null);
  const [selectedDataRecords, setSelectedDataRecords] = useState<DataRecord[]>(
    [],
  );
  const [results, setResults] = useState<Record<number, RelationshipResult>>(
    {},
  );
  const [activeRelationshipIndex, setActiveRelationshipIndex] = useState<
    number | null
  >(null);

  function setResult(index: number, result: RelationshipResult) {
    setResults((prev) => ({ ...prev, [index]: result }));
  }

  function clearResults() {
    setResults({});
  }

  return (
    <WidgetContext.Provider
      value={{
        jimuMapView,
        setJimuMapView,
        selectedDataRecords,
        setSelectedDataRecords,
        results,
        setResult,
        clearResults,
        activeRelationshipIndex,
        setActiveRelationshipIndex,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgetContext(): WidgetContextValue {
  const ctx = useContext(WidgetContext);
  if (!ctx) {
    throw new Error(
      "useWidgetContext must be used inside WidgetContextProvider",
    );
  }
  return ctx;
}

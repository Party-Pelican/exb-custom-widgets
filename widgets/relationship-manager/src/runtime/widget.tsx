import {
  DataSource,
  DataSourceComponent,
  DataSourceManager,
  FeatureDataRecord,
  FeatureLayerDataSource,
  FeatureLayerQueryParams,
  IMDataSourceInfo,
  JSAPILayerMixin,
  React,
  type AllWidgetProps,
} from "jimu-core";
import type { IMConfig } from "../config";
import {
  CalciteButton,
  CalciteNotice,
  CalcitePanel,
  CalciteStepper,
  CalciteStepperItem,
  CalciteTable,
  CalciteTableRow,
  CalciteTableHeader,
  CalciteTableCell,
} from "calcite-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArcgisFeatures } from "@arcgis/map-components-react";
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const cfg = props.config;
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null);

  // Selected records keyed by datasource ID
  const [selectedRecords, setSelectedRecords] = useState<
    Record<string, FeatureDataRecord[]>
  >({});

  // Refs to each ArcgisFeatures component, keyed by datasource ID
  const featuresRefs = useRef<Record<string, HTMLArcgisFeaturesElement | null>>(
    {},
  );

  // Drive ArcgisFeatures.open()/clear() via effect so it runs outside the render phase
  useEffect(() => {
    for (const [dsId, records] of Object.entries(selectedRecords)) {
      const el = featuresRefs.current[dsId];
      if (!el) continue;
      const graphics = records
        .map((r) => r.feature as __esri.Graphic)
        .filter(Boolean);
      if (graphics.length > 0) {
        el.open({ features: graphics });
      } else {
        el.clear();
      }
    }
  }, [selectedRecords]);

  // Tracks the previous serialized selection IDs per datasource.
  // Compared synchronously in the render-prop to prevent setState-in-render loops.
  const prevIdsRef = useRef<Record<string, string>>({});
  const uniqueDataSources = useMemo(() => {
    const seen = new Set<string>();
    const result: (typeof cfg.rules)[0]["sourceUseDataSource"][] = [];
    if (!cfg.rules) return result;
    cfg.rules.forEach((rule) => {
      const dsId = rule.sourceUseDataSource?.dataSourceId;
      if (dsId && !seen.has(dsId)) {
        seen.add(dsId);
        result.push(rule.sourceUseDataSource);
      }
    });
    return result;
  }, [cfg.rules]);

  // Returns a DataSourceComponent render-prop child for the given datasource ID.
  // State is only updated when the selection actually changes (ref comparison),
  // and the update is scheduled as a microtask so it runs outside the render phase.
  const makeChildrenFor =
    (dsId: string) =>
    (ds: DataSource, info: IMDataSourceInfo): React.ReactElement => {
      const newKey = JSON.stringify(info.selectedIds ?? []);
      if (prevIdsRef.current[dsId] !== newKey) {
        prevIdsRef.current[dsId] = newKey;
        const records = (ds.getSelectedRecords() ??
          []) as unknown as FeatureDataRecord[];
        console.log(`[relationship-manager] ${dsId} selection:`, records);
        Promise.resolve().then(() =>
          setSelectedRecords((prev) => ({ ...prev, [dsId]: records })),
        );
      }
      return <></>;
    };

  const allSelected =
    uniqueDataSources.length > 0 &&
    uniqueDataSources.every(
      (uds) => uds && (selectedRecords[uds.dataSourceId] ?? []).length > 0,
    );

  type SubmitStatus = "idle" | "submitting" | "success" | "error";
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = useCallback(async () => {
    setSubmitStatus("submitting");
    setSubmitError("");
    try {
      const intDs = cfg?.intermediateDataSourceId
        ? DataSourceManager.getInstance().getDataSource(
            cfg.intermediateDataSourceId,
          )
        : null;
      const intLayer = (intDs as DataSource & JSAPILayerMixin)
        ?.layer as __esri.FeatureLayer;
      if (!intLayer) {
        setSubmitStatus("error");
        setSubmitError("Intermediate table layer not available.");
        return;
      }

      // Build one new feature per combination of selected records (cartesian
      // product across all datasources), applying all rules to copy field values.
      const rules = Array.from(cfg?.rules ?? []);

      const dsRecordSets = uniqueDataSources
        .filter((uds) => uds != null)
        .map((uds) => {
          const dsId = uds!.dataSourceId;
          const allRecords = selectedRecords[dsId] ?? [];
          const mode =
            (
              cfg?.sourceSelectionModes as unknown as
                | Record<string, "one" | "many">
                | undefined
            )?.[dsId] ?? "many";
          const records = mode === "one" ? allRecords.slice(0, 1) : allRecords;
          return { dsId, records };
        });

      // Cartesian product: [[r1a, r2a], [r1a, r2b], [r1b, r2a], ...]
      const combinations = dsRecordSets.reduce<FeatureDataRecord[][]>(
        (acc, { records }) =>
          acc.flatMap((combo) => records.map((rec) => [...combo, rec])),
        [[]],
      );

      const newFeatures = combinations.map((combo) => {
        const recordByDsId = Object.fromEntries(
          dsRecordSets.map(({ dsId }, i) => [dsId, combo[i]]),
        );
        const attributes: Record<string, unknown> = {};
        rules.forEach((rule) => {
          const rec = recordByDsId[rule.sourceDataSourceId];
          const graphic = rec?.feature as __esri.Graphic | undefined;
          if (
            graphic &&
            rule.sourceDataSourceField &&
            rule.targetDataSourceField
          ) {
            attributes[rule.targetDataSourceField] =
              graphic.attributes?.[rule.sourceDataSourceField];
          }
        });
        return { attributes } as unknown as __esri.Graphic;
      });

      const result = await intLayer.applyEdits({ addFeatures: newFeatures });
      const hasError = result.addFeatureResults?.some((r) => r.error);
      if (hasError) {
        setSubmitStatus("error");
        setSubmitError("One or more rows failed to insert.");
      } else {
        // Refresh the intermediate table and all source layers so the map
        // popup re-queries related records from the server instead of its cache.
        const layersToRefresh: __esri.FeatureLayer[] = [intLayer];
        uniqueDataSources.forEach((uds) => {
          if (!uds) return;
          const ds = DataSourceManager.getInstance().getDataSource(
            uds.dataSourceId,
          ) as DataSource & JSAPILayerMixin;
          const lyr = ds?.layer as __esri.FeatureLayer;
          if (lyr?.refresh) layersToRefresh.push(lyr);
        });
        await Promise.all(layersToRefresh.map((lyr) => lyr.refresh()));
        setSubmitStatus("success");
      }
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Unknown error.");
    }
  }, [cfg, uniqueDataSources, selectedRecords]);

  return (
    <>
      {props.useMapWidgetIds?.[0] && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={(view) => setJimuMapView(view ?? null)}
        />
      )}

      {/* One DataSourceComponent per unique source datasource to track selection */}
      {uniqueDataSources.map((uds) =>
        uds ? (
          <DataSourceComponent
            key={uds.dataSourceId}
            widgetId={props.id}
            useDataSource={uds}
            query={{ where: "1=1" } as FeatureLayerQueryParams}
          >
            {makeChildrenFor(uds.dataSourceId)}
          </DataSourceComponent>
        ) : null,
      )}

      <CalcitePanel>
        <CalciteStepper style={{ padding: "5px", overflow: "hidden" }}>
          {/* One step per unique source datasource */}
          {uniqueDataSources.map((uds) => {
            if (!uds) return null;
            const dsId = uds.dataSourceId;
            const lds = DataSourceManager.getInstance().getDataSource(
              dsId,
            ) as unknown as FeatureLayerDataSource;
            const records = selectedRecords[dsId] ?? [];
            const layerTitle = lds?.layer?.title ?? dsId;
            const title =
              ((cfg?.stepperTitles as unknown as Record<string, string>) ?? {})[
                dsId
              ] || layerTitle;
            return (
              <CalciteStepperItem
                key={dsId}
                heading={title}
                complete={records.length > 0}
              >
                {/* ArcgisFeatures is always mounted; hidden when nothing is selected to avoid open() race */}
                <div
                  style={{ display: records.length === 0 ? "none" : "block" }}
                >
                  <ArcgisFeatures
                    hideActionBar
                    hideCloseButton
                    featureNavigationTop
                    map={jimuMapView?.view?.map ?? undefined}
                    ref={(el: HTMLArcgisFeaturesElement | null) => {
                      featuresRefs.current[dsId] = el;
                      // Also open immediately when the element first mounts (e.g. stepper navigated back)
                      if (el && records.length > 0) {
                        const graphics = records
                          .map((r) => r.feature as __esri.Graphic)
                          .filter(Boolean);
                        el.open({ features: graphics });
                      }
                    }}
                  />
                </div>
                {records.length === 0 && (
                  <p>
                    {((cfg?.noSelectionMessages as unknown as Record<
                      string,
                      string
                    >) ?? {})[dsId] || `Select a feature from ${title}.`}
                  </p>
                )}
              </CalciteStepperItem>
            );
          })}

          {/* Review step — only shown when intermediate table is configured */}
          {cfg.intermediateDataSourceId && uniqueDataSources.length > 0 && (
            <CalciteStepperItem heading="Review">
              {!allSelected ? (
                <p>Select a feature from each layer above to continue.</p>
              ) : (
                <>
                  {/* Summary table */}
                  <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                    The following fields will be written to the intermediate
                    table:
                  </p>
                  <CalciteTable
                    style={{ marginBottom: "1rem" }}
                    caption="Field mapping preview"
                  >
                    <CalciteTableRow slot="table-header">
                      <CalciteTableHeader heading="Source layer" />
                      <CalciteTableHeader heading="Source field" />
                      <CalciteTableHeader heading="Value" />
                      <CalciteTableHeader heading="→ Target field" />
                    </CalciteTableRow>
                    {Array.from(cfg?.rules ?? []).map((rule, i) => {
                      const records =
                        selectedRecords[rule.sourceDataSourceId] ?? [];
                      const graphic = records[0]?.feature as
                        | __esri.Graphic
                        | undefined;
                      const value =
                        graphic?.attributes?.[rule.sourceDataSourceField] ??
                        "—";
                      const lds = DataSourceManager.getInstance().getDataSource(
                        rule.sourceDataSourceId,
                      ) as unknown as FeatureLayerDataSource;
                      const layerTitle =
                        lds?.layer?.title ?? rule.sourceDataSourceId;
                      return (
                        <CalciteTableRow key={i}>
                          <CalciteTableCell>{layerTitle}</CalciteTableCell>
                          <CalciteTableCell>
                            {rule.sourceDataSourceField}
                          </CalciteTableCell>
                          <CalciteTableCell>{String(value)}</CalciteTableCell>
                          <CalciteTableCell>
                            {rule.targetDataSourceField}
                          </CalciteTableCell>
                        </CalciteTableRow>
                      );
                    })}
                  </CalciteTable>

                  {submitStatus === "success" && (
                    <CalciteNotice
                      open
                      kind="success"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <span slot="message">Row(s) inserted successfully.</span>
                    </CalciteNotice>
                  )}
                  {submitStatus === "error" && (
                    <CalciteNotice
                      open
                      kind="danger"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <span slot="message">{submitError}</span>
                    </CalciteNotice>
                  )}

                  <CalciteButton
                    width="full"
                    loading={submitStatus === "submitting" || undefined}
                    disabled={submitStatus === "submitting" || undefined}
                    onClick={handleSubmit}
                  >
                    Submit
                  </CalciteButton>
                </>
              )}
            </CalciteStepperItem>
          )}
        </CalciteStepper>
      </CalcitePanel>
    </>
  );
};

export default Widget;

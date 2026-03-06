import { React, type AllWidgetProps } from "jimu-core";
import { type IMConfig } from "../config";
import { JimuMapViewComponent } from "jimu-arcgis";
import MediaLayer from "@arcgis/core/layers/MediaLayer.js";
import ImageElement from "@arcgis/core/layers/support/ImageElement.js";
import ExtentAndRotationGeoreference from "@arcgis/core/layers/support/ExtentAndRotationGeoreference.js";
import Extent from "@arcgis/core/geometry/Extent.js";
import { CalciteBlock, CalcitePanel, CalciteShell } from "calcite-components";

function createImageElement(name, box) {
  const imageElement = new ImageElement({
    image: `https://arcgis.github.io/arcgis-samples-javascript/sample-data/media-layer/new-orleans/${name}.png`,
    georeference: new ExtentAndRotationGeoreference({
      extent: new Extent({
        spatialReference: {
          wkid: 102100,
        },
        xmin: box.xmin,
        ymin: box.ymin,
        xmax: box.xmax,
        ymax: box.ymax,
      }),
    }),
  });
  return imageElement;
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
  function onActiveViewChange(view) {
    console.log("Active view changed:", view);
  }

  return (
    <>
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />
      <CalciteShell>
        <CalcitePanel>
          <CalciteBlock open>
            <input type="file"></input>
          </CalciteBlock>
        </CalcitePanel>
      </CalciteShell>
    </>
  );
}

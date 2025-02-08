import { React, type AllWidgetProps, IMState } from "jimu-core";
import { type IMConfig } from "../config";
import { ButtonGroup, Button, Icon } from "jimu-ui";
import { useDispatch, useSelector } from "react-redux";
import { MyActionKeys } from "../extensions/ont-redux";

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const selectionMode = useSelector(
    (state: IMState) => state.selectModeState?.mode
  );
  const dispatch = useDispatch();

  function handleSelectionChange(mode: string) {
    dispatch({ type: MyActionKeys.UPDATE_MODE, val: mode });
  }

  return (
    <ButtonGroup>
      <Button
        value={"click"}
        active={selectionMode === "click"}
        onClick={() => {
          handleSelectionChange("click");
        }}
      >
        Click
      </Button>
      <Button
        value={"polyline"}
        active={selectionMode === "polyline"}
        onClick={() => {
          handleSelectionChange("polyline");
        }}
      >
        Polyline
      </Button>
      <Button
        value={"polygon"}
        active={selectionMode === "polygon"}
        onClick={() => {
          handleSelectionChange("polygon");
        }}
      >
        Polygon
      </Button>
    </ButtonGroup>
  );
}

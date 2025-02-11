import { React } from "jimu-core";
import { WidgetPlaceholder } from "jimu-ui";
import { SlotPlaceholderProps } from "./slot-placeholder.types";

const icon = require("../../src/runtime/assets/icons/plus-square-24.svg");

export default function SlotPlaceholder({ slot }: SlotPlaceholderProps) {
  return slot ? (
    <WidgetPlaceholder icon={icon} slot={slot} className="w-100 h-100" />
  ) : (
    <WidgetPlaceholder icon={icon} className="w-100 h-100" />
  );
}

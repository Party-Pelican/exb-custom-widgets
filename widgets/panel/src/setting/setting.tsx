import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import { PanelConfig } from "../panel-config.types";
import SlotVisibility from "../../components/slot-visibility/slot-visibility";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const { config, onSettingChange } = props;

  function updateConfig(newConfig: Partial<PanelConfig>) {
    onSettingChange({
      id: props.id,
      config: props.config.set("panel", {
        ...props.config.panel,
        ...newConfig,
      }),
    });
  }

  return (
    <>
      <SlotVisibility
        slotVisibilityConfig={config.panel?.slotsVisibility || {}}
        onUpdate={(updatedSlots) =>
          updateConfig({ slotsVisibility: updatedSlots })
        }
      />
    </>
  );
}

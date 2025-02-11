import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import { ShellConfig } from "../shell-config.types";
import SlotVisibilitySetting from "../../components/slot-visibility-setting/slot-visibility-setting";
import ContentBehindSetting from "../../components/content-behind-setting/content-behind-setting";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const { config, onSettingChange } = props;

  function updateConfig(newConfig: Partial<ShellConfig>) {
    onSettingChange({
      id: props.id,
      config: props.config.set("shell", {
        ...props.config.shell,
        ...newConfig,
      }),
    });
  }

  return (
    <>
      <ContentBehindSetting
        contentBehindConfig={config.shell?.contentBehind}
        onUpdate={(updatedContentBehind) =>
          updateConfig({ contentBehind: updatedContentBehind })
        }
      />
      <SlotVisibilitySetting
        slotVisibilityConfig={config.shell?.slotsVisibility || {}}
        onUpdate={(updatedSlots) =>
          updateConfig({ slotsVisibility: updatedSlots })
        }
      />
    </>
  );
}

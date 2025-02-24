import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import SlotVisibilitySetting from "../../components/slot-visibility-setting/slot-visibility-setting";
import ContentBehindSetting from "../../components/content-behind-setting/content-behind-setting";
import { WidgetProvider } from "../../context/widget-context";

function SettingContent() {
  return (
    <>
      <ContentBehindSetting />
      <SlotVisibilitySetting />
    </>
  );
}

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  return (
    <WidgetProvider {...props}>
      <SettingContent {...props} />
    </WidgetProvider>
  );
}

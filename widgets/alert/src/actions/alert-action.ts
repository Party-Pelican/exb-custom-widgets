import {
  AbstractMessageAction,
  MessageType,
  type Message,
  getAppStore,
  appActions,
  type StringSelectionChangeMessage,
  type DataRecordsSelectionChangeMessage,
  type MessageDescription,
} from "jimu-core";

export default class AlertAction extends AbstractMessageAction {
  filterMessageDescription(messageDescription: MessageDescription): boolean {
    return [
      MessageType.StringSelectionChange,
      MessageType.DataRecordsSelectionChange,
      MessageType.ButtonClick,
    ].includes(messageDescription.messageType);
  }

  filterMessage(message: Message): boolean {
    return true;
  }

  //set action setting uri
  getSettingComponentUri(
    messageType: MessageType,
    messageWidgetId?: string
  ): string {
    return "actions/alert-action-setting";
  }

  onExecute(message: Message, actionConfig?: any): Promise<boolean> | boolean {
    const newConfig = { ...actionConfig.alertConfig, open: true };
    getAppStore().dispatch(
      appActions.widgetStatePropChange(this.widgetId, "alertConfig", newConfig)
    );
    return true;
  }
}

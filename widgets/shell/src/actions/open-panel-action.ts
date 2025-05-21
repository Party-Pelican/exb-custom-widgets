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

export default class OpenPanelAction extends AbstractMessageAction {
  filterMessageDescription(messageDescription: MessageDescription): boolean {
    return [
      MessageType.DataSourceFilterChange,
      MessageType.DataRecordsSelectionChange,
      MessageType.StringSelectionChange,
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
    return "actions/open-panel-action-setting";
  }

  onExecute(message: Message, actionConfig?: any): Promise<boolean> | boolean {
    console.group("action executed");
    console.log("message", message);
    console.log("actionConfig", actionConfig);
    console.groupEnd();

    getAppStore().dispatch(
      appActions.widgetStatePropChange(
        actionConfig.targetLayoutWidget,
        "selectedItemId",
        String(actionConfig.selectedItemId)
      )
    );
    return true;
  }
}

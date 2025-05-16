import { IMState, React } from "jimu-core";
import { Switch, Select, Option, TextInput, Label } from "jimu-ui";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const layoutItems = useSelector((state: IMState) => {
    const appConfig = state.appStateInBuilder?.appConfig;

    const widgetJson = appConfig.widgets?.[props.id];

    const layoutName = Object.keys(widgetJson.layouts)[0];

    const layout = Object.values(appConfig.layouts).find(
      (i) => i.label === layoutName
    );

    return layout;
  });

  function updateConfig(keyPath: (string | number)[], value: any) {
    const stringKeyPath = keyPath.map(String);
    const newConfig = props.config.setIn(stringKeyPath, value);
    props.onSettingChange({
      id: props.id,
      config: newConfig,
    });
  }

  useEffect(() => {
    if (!layoutItems?.content) return;

    const layoutContent = Object.values(layoutItems.content);

    // If config.actions is undefined, default to an empty list
    const currentActions = props.config.actions ?? [];

    let updatedActions = [...currentActions];

    let hasChanges = false;

    layoutContent.forEach((item, index) => {
      if (!updatedActions[index]) {
        // Create default action if it doesn't exist
        updatedActions[index] = {
          id: item.id,
          icon: "widgets-group",
          appearance: "solid",
          label: "widget",
          text: "widget",
          textEnabled: true,
          alignment: "start",
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updateConfig(["actions"], updatedActions);
    }
  }, [layoutItems]);

  return (
    <div style={{ padding: "1rem" }}>
      {/* <SettingSection title="Shell">
        <SettingRow>
          <Label>Content Behind</Label>
          <Switch
            className="ml-2"
            checked={props.config.shell.contentBehind}
            onChange={(e) =>
              updateConfig(["shell", "contentBehind"], e.target.checked)
            }
          />
        </SettingRow>
      </SettingSection> */}

      <SettingSection title="Panel">
        <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
          <SettingRow>
            <Label>Closable</Label>
            <Switch
              className="ml-2"
              checked={props.config.panel.closable}
              onChange={(e) =>
                updateConfig(["panel", "closable"], e.target.checked)
              }
            />
          </SettingRow>
          <Label>Menu Placement</Label>
          <Select
            value={props.config.panel.menuPlacement}
            onChange={(e) =>
              updateConfig(["panel", "menuPlacement"], e.target.value)
            }
          >
            <Option value="auto">auto</Option>
            <Option value="auto-end">auto-end</Option>
            <Option value="auto-start">auto-start</Option>
            <Option value="bottom">bottom</Option>
            <Option value="bottom-end">bottom-end</Option>
            <Option value="bottom-start">bottom-start</Option>
            <Option value="leading">leading</Option>
            <Option value="leading-end">leading-end</Option>
            <Option value="leading-start">leading-start</Option>
            <Option value="left">left</Option>
            <Option value="left-end">left-end</Option>
            <Option value="left-start">left-start</Option>
            <Option value="right">right</Option>
            <Option value="right-end">right-end</Option>
            <Option value="right-start">right-start</Option>
            <Option value="top">top</Option>
            <Option value="top-end">top-end</Option>
            <Option value="top-start">top-start</Option>
            <Option value="trailing">trailing</Option>
            <Option value="trailing-end">trailing-end</Option>
            <Option value="trailing-start">trailing-start</Option>
          </Select>
          <Label>Menu Placement</Label>
          <Select
            value={props.config.panel.overlayPositioning}
            onChange={(e) =>
              updateConfig(["panel", "overlayPositioning"], e.target.value)
            }
          >
            <Option value="absolute">absolute</Option>
            <Option value="fixed">fixed</Option>
          </Select>
        </div>
      </SettingSection>

      <SettingSection title="Shell Panel">
        <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
          {/* <SettingRow>
            <Label>Collapsed</Label>
            <Switch
              className="ml-2"
              checked={props.config.shellPanel.collapsed}
              onChange={(e) =>
                updateConfig(["shellPanel", "collapsed"], e.target.checked)
              }
            />
          </SettingRow> */}

          <Label>Panel Slot</Label>
          <Select
            value={props.config.shellPanel.slot}
            onChange={(e) =>
              updateConfig(["shellPanel", "slot"], e.target.value)
            }
          >
            <Option value="panel-start">panel-start</Option>
            <Option value="panel-end">panel-end</Option>
            <Option value="panel-top">panel-top</Option>
            <Option value="panel-bottom">panel-bottom</Option>
          </Select>

          <Label>Display Mode</Label>
          <Select
            value={props.config.shellPanel.displayMode}
            onChange={(e) =>
              updateConfig(["shellPanel", "displayMode"], e.target.value)
            }
          >
            <Option value="dock">Dock</Option>
            <Option value="float-all">Float All</Option>
            <Option value="float-content">Float Content</Option>
            <Option value="overlay">Overlay</Option>
          </Select>

          <Label>Layout</Label>
          <Select
            value={props.config.shellPanel.layout}
            onChange={(e) =>
              updateConfig(["shellPanel", "layout"], e.target.value)
            }
          >
            <Option value="vertical">Vertical</Option>
            <Option value="horizontal">Horizontal</Option>
          </Select>

          <Label>Position</Label>
          <Select
            value={props.config.shellPanel.position}
            onChange={(e) =>
              updateConfig(["shellPanel", "position"], e.target.value)
            }
          >
            <Option value="start">Start</Option>
            <Option value="end">End</Option>
          </Select>

          <SettingRow>
            <Label>Resizable</Label>
            <Switch
              className="ml-2"
              checked={props.config.shellPanel.resizable}
              onChange={(e) =>
                updateConfig(["shellPanel", "resizable"], e.target.checked)
              }
            />
          </SettingRow>
        </div>
      </SettingSection>

      <SettingSection title="Action Bar">
        <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
          <SettingRow>
            <Label>Expand Disabled</Label>
            <Switch
              className="ml-2"
              checked={props.config.actionBar.expandDisabled}
              onChange={(e) =>
                updateConfig(["actionBar", "expandDisabled"], e.target.checked)
              }
            />
          </SettingRow>

          <SettingRow>
            <Label>Expanded</Label>
            <Switch
              className="ml-2"
              checked={props.config.actionBar.expanded}
              onChange={(e) =>
                updateConfig(["actionBar", "expanded"], e.target.checked)
              }
            />
          </SettingRow>

          {/* <Label>Layout</Label>
          <Select
            value={props.config.actionBar.layout}
            onChange={(e) =>
              updateConfig(["actionBar", "layout"], e.target.value)
            }
          >
            <Option value="vertical">Vertical</Option>
            <Option value="horizontal">Horizontal</Option>
          </Select> */}

          <Label>Position</Label>
          <Select
            value={props.config.actionBar.position}
            onChange={(e) =>
              updateConfig(["actionBar", "position"], e.target.value)
            }
          >
            <Option value="start">Start</Option>
            <Option value="end">End</Option>
          </Select>
        </div>
      </SettingSection>

      {(props.config.actions ?? []).map((actionItem, i) => {
        return (
          <SettingSection title={`Action ${i + 1}`} key={actionItem.id}>
            <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
              <Label>Appearance</Label>
              <Select
                value={
                  props.config.actions[i]
                    ? props.config.actions[i].appearance
                    : "solid"
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "appearance"], e.target.value)
                }
              >
                <Option value="solid">Solid</Option>
                <Option value="transparent">Transparent</Option>
              </Select>
              <Label>Alignment</Label>
              <Select
                value={
                  props.config.actions[i]
                    ? props.config.actions[i].alignment
                    : "start"
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "alignment"], e.target.value)
                }
              >
                <Option value="start">Start</Option>
                <Option value="end">End</Option>
                <Option value="center">Center</Option>
              </Select>

              <Label>Icon</Label>
              <TextInput
                value={
                  props.config.actions[i]
                    ? props.config.actions[i].icon
                    : "widgets-group"
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "icon"], e.target.value)
                }
              />

              <Label>Label</Label>
              <TextInput
                value={
                  props.config.actions[i]
                    ? props.config.actions[i].label
                    : "widget"
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "label"], e.target.value)
                }
              />

              <Label>Text</Label>
              <TextInput
                value={
                  props.config.actions[i]
                    ? props.config.actions[i].text
                    : "widget"
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "text"], e.target.value)
                }
              />
            </div>

            <SettingRow className="mt-2">
              <Label>Text Enabled</Label>
              <Switch
                className="ml-2"
                checked={
                  props.config.actions[i]
                    ? props.config.actions[i].textEnabled
                    : true
                }
                onChange={(e) =>
                  updateConfig(["actions", i, "textEnabled"], e.target.checked)
                }
              />
            </SettingRow>
          </SettingSection>
        );
      })}
    </div>
  );
}

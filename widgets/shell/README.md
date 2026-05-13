# Shell Widget

An ArcGIS Experience Builder layout widget that provides a full application shell using [Calcite Shell](https://developers.arcgis.com/calcite-design-system/components/shell/) components. It combines a collapsible side panel (with an action bar for navigation), a main content area (typically a map), and supports cross-widget messaging to open specific panels programmatically.

## How It Works

The widget uses two internal layouts:

- **`shell-panel-layout`** — Widgets added here appear as items in the side panel. Each item gets a corresponding icon button in the `CalciteActionBar`.
- **`shell-main-layout`** — The first widget added here fills the main content area (typically a Map widget).

At runtime:

- The action bar displays one icon button per panel widget.
- Clicking an icon opens that widget inside the `CalcitePanel` on the side.
- Clicking the same icon or closing the panel collapses it.
- A default panel item can be pre-selected to open on load.
- Other widgets can trigger the **"open panel"** message action to open a specific panel item programmatically.

## Setup

1. Add the **Shell** widget to your Experience Builder app.
2. In the **shell-main-layout** area, add your main content widget (e.g., a Map widget).
3. In the **shell-panel-layout** area, add the widgets you want accessible from the side panel (e.g., Select By, Legend, Layer List).
4. Open the widget settings to configure the action bar buttons, panel behavior, and default open item.

## Settings

### General

| Setting                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| **Default open panel** | Which panel item is open when the app loads. Set to `Null` for none. |

### Panel

| Setting                 | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| **Closable**            | Whether the panel shows a close/dismiss button.                 |
| **Menu Placement**      | Placement of the panel's context menu.                          |
| **Overlay Positioning** | CSS positioning strategy for the panel (`absolute` or `fixed`). |

### Shell Panel (Sidebar)

| Setting          | Description                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Slot**         | Which side the panel appears on (`panel-start`, `panel-end`, `panel-top`, `panel-bottom`). |
| **Display Mode** | How the panel is displayed (`dock`, `float-all`, `float-content`, `overlay`).              |
| **Resizable**    | Whether the user can resize the panel.                                                     |

### Action Bar

| Setting             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| **Expand Disabled** | Hides the expand/collapse toggle on the action bar.         |
| **Expanded**        | Whether the action bar starts expanded (shows labels).      |
| **Layout**          | Orientation of the action bar (`vertical` or `horizontal`). |

### Action Buttons (per panel widget)

Each widget added to the panel layout automatically gets a configurable action button:

| Setting          | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| **Icon**         | Calcite icon name for the button.                                      |
| **Text**         | Label shown in the panel header and (when expanded) in the action bar. |
| **Text Enabled** | Whether the text label is shown in the action bar.                     |
| **Appearance**   | Button style (`solid` or `transparent`).                               |
| **Alignment**    | Button alignment (`start`, `center`, `end`).                           |

## Usage

1. At runtime the shell renders the main content area alongside the collapsible side panel.
2. Click any action bar button to open the corresponding panel widget.
3. Click the same button again, or the panel's close button, to dismiss it.
4. Other widgets can send the **"open panel"** message to open a specific panel item without user interaction.

## Requirements

- ArcGIS Experience Builder 1.17+
- No data source connection required, but a Map widget is recommended for the main layout area.

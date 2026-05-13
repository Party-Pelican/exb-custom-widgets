# Flow Widget

A layout widget for ArcGIS Experience Builder that presents a navigable list of child widgets using the [Calcite Flow](https://developers.arcgis.com/calcite-design-system/components/flow/) component. Users can click a list item to drill into that widget and use a back button to return to the list.

## How It Works

The widget renders two views:

1. **List view** — Displays all widgets added to its internal `flow-layout` as a `CalciteList`. An optional heading and description are shown above the list.
2. **Detail view** — When a list item is clicked, that widget is pushed onto the flow stack inside a `CalciteFlowItem`. A back button returns the user to the list.

The widget is a `LAYOUT` type, meaning it hosts other widgets inside its own layout rather than rendering data directly.

## Setup

1. Add the **Flow** widget to your Experience Builder app.
2. In the widget's layout area, add any child widgets you want to appear in the list (e.g., a filter widget, a chart, a form).
3. Open the widget settings panel and configure the list heading and description.

## Settings

| Setting         | Description                                  |
| --------------- | -------------------------------------------- |
| **Heading**     | Title displayed at the top of the list view. |
| **Description** | Subtitle displayed below the heading.        |

## Usage

- At runtime, the widget displays the list of child widgets by their label.
- Click any item in the list to navigate into that widget.
- Click the **Back** button in the flow item header to return to the list.

## Requirements

- ArcGIS Experience Builder 1.17+
- No map widget or data source connection required.

# Select By Widget

An ArcGIS Experience Builder widget that lets users select features on a map using attribute queries (SQL) or spatial relationships. Selection results are applied directly to the linked map's feature layer data sources and reflected across all connected widgets.

## How It Works

The widget provides two selection modes, each opening in a floating panel:

### Select by Attributes

Queries a feature layer using a SQL `WHERE` clause. Users can either:

- Use the **visual SQL expression builder** (drag-and-drop field/value interface), or
- Toggle to **manual SQL mode** to type a raw SQL expression.

### Select by Location

Queries features from one layer based on their spatial relationship to features in another layer. Supports eight spatial relationships (Intersects, Contains, Crosses, Envelope Intersects, Index Intersects, Overlaps, Touches, Within). Optionally restricts the selecting layer to its currently selected features only.

### Selection Modes

Both forms support four selection methods:

| Mode                         | Behavior                                                            |
| ---------------------------- | ------------------------------------------------------------------- |
| **New selection**            | Replaces the current selection entirely.                            |
| **Add to selection**         | Adds matched features to the existing selection.                    |
| **Remove from selection**    | Removes matched features from the existing selection.               |
| **Intersect with selection** | Keeps only features that are in both the current and new selection. |

## Setup

1. Add the **Select By** widget to your Experience Builder app.
2. Add a **Map** widget to the app.
3. Open the Select By widget settings and select your map widget from the **Map Widget Selector**.
4. Ensure your map contains one or more Feature Layers — the widget's buttons are disabled until feature layers are detected.

## Settings

| Setting        | Description                                                |
| -------------- | ---------------------------------------------------------- |
| **Map Widget** | The map whose feature layers will be queried and selected. |

## Usage

1. At runtime, click **Select by Attributes** or **Select by Location** — the corresponding floating panel opens.
2. **Select by Attributes:**
   - Choose a layer from the dropdown.
   - Build a SQL expression using the expression builder, or toggle the SQL switch to enter a raw query.
   - Choose a selection method and click **Apply**.
3. **Select by Location:**
   - Choose the layer to select features **in** (input layer).
   - Choose the layer whose features will be used as the selecting geometry.
   - Choose a spatial relationship.
   - Optionally enable **Use selected features only** to restrict the selecting layer to its current selection.
   - Choose a selection method and click **Apply**.
4. A result message confirms how many features were matched and selected. Green indicates success; yellow indicates zero matches.

## Requirements

- ArcGIS Experience Builder 1.15+
- A Map widget connected to a web map containing one or more Feature Layers.
- red: query/selection failure with error details (when available)

Progress is shown while requests are running.

## Notes and Current Limits

- Location-based selection unions selected features from the selecting layer before querying the input layer.
- If the selecting layer has no current selection, it loads up to 2000 records to build the spatial input.
- SQL validation is required before running when SQL mode is enabled.

## Key Files

- `src/runtime/widget.tsx`: entry UI and form launcher
- `src/components/attributeForm/attributeForm.tsx`: attribute selection workflow
- `src/components/locationForm/locationForm.tsx`: spatial selection workflow
- `src/components/sqlForm/sqlForm.tsx`: SQL input and validation
- `src/setting/setting.tsx`: map widget configuration

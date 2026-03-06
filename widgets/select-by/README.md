# Select By Widget

The Select By widget lets users select features in the connected map using:

- attribute criteria (SQL expression builder or SQL text)
- spatial relationship against another layer

## Setup

1. Add the widget to an Experience.
2. Open widget settings.
3. Choose a map with feature layers.

## Runtime Usage

### Select by Attributes

1. Click **Select by Attributes**.
2. Choose the input layer.
3. Choose a selection type:
   - **New selection**
   - **Add to selection**
   - **Remove from selection**
   - **Select from current selection**
4. Build an expression with the clause builder, or switch to SQL.
5. Click **Apply** or **OK**.

### Select by Location

1. Click **Select by Location**.
2. Choose the input layer.
3. Choose a spatial relationship.
4. Choose the selecting features layer.
5. Choose a selection type (new/add/remove/intersect).
6. Click **Apply** or **OK**.

## Feedback and Status

The forms provide inline status:

- green: matched and selected records
- yellow: zero matching records
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

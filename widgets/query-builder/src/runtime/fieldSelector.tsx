import { React } from "jimu-core";
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from "jimu-ui";
import { type JimuField } from "./conditionController";

export default function FieldSelector({
  selectedField,
  availableFields,
  updateField,
  updateType,
}: {
  selectedField: string;
  availableFields: JimuField[];
  updateField: (field: string) => void;
  updateType: (type: string) => void;
}) {
  function handleFieldSelected(e: MouseEvent) {
    const fieldSelected = (e.target as HTMLInputElement).value;
    updateField((e.target as HTMLInputElement).value);
    updateType(availableFields.find((f) => f.name === fieldSelected).type);
  }

  return (
    <Dropdown activeIcon menuItemCheckMode="singleCheck" menuRole="listbox">
      <DropdownButton>{selectedField || "Select a Field"}</DropdownButton>
      <DropdownMenu>
        {availableFields?.length > 0 &&
          availableFields.map((field) => {
            return (
              <DropdownItem
                active={field.name === selectedField}
                value={field.name}
                key={field.name}
                onClick={handleFieldSelected}
              >
                {field.name}
              </DropdownItem>
            );
          })}
      </DropdownMenu>
    </Dropdown>
  );
}

import { React } from "jimu-core";
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from "jimu-ui";

const numericOperators = [
  "=", // Equal to
  "<>", // Not equal to (ESRI uses '<>')
  ">", // Greater than
  "<", // Less than
  ">=", // Greater than or equal to
  "<=", // Less than or equal to
  "BETWEEN", // Between two values
];
const stringOperators = [
  "=", // Equal to
  "<>", // Not equal to
  "LIKE", // Contains (ESRI uses 'LIKE' for partial matches)
  "NOT LIKE", // Does not contain
  "STARTS WITH", // Starts with (typically implemented using LIKE in ESRI)
  "ENDS WITH", // Ends with (also implemented using LIKE in ESRI)
  "IS NULL", // Is null
  "IS NOT NULL", // Is not null
];

export default function OperatorSelector({
  selectedOperator,
  type,
  updateOperator,
}: {
  selectedOperator: string;
  type: string;
  updateOperator: (operator: string) => void;
}) {
  const availableTypes = type === "STRING" ? stringOperators : numericOperators;
  if (!availableTypes.includes(selectedOperator)) {
    updateOperator(availableTypes[0]);
  }

  function handleOperatorSelected(e: MouseEvent) {
    const operatorSelected = (e.target as HTMLInputElement).value;
    updateOperator(operatorSelected);
  }

  return (
    <Dropdown activeIcon menuItemCheckMode="singleCheck" menuRole="listbox">
      <DropdownButton>
        {selectedOperator || "Select an Operator"}
      </DropdownButton>
      <DropdownMenu>
        {availableTypes.map((operator) => {
          return (
            <DropdownItem
              active={operator === selectedOperator}
              value={operator}
              key={operator}
              onClick={handleOperatorSelected}
            >
              {operator}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}

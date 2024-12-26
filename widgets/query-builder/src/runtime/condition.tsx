import { React } from "jimu-core";
import { type QueryCondition, type JimuField } from "./conditionController";
import FieldSelector from "./fieldSelector";
import OperatorSelector from "./operatorSelector";
import ValueSelector from "./valueSelector";

type ConditionProps = {
  availableFields: JimuField[];
  updateCondition: (index: number, updatedCondition: QueryCondition) => void;
  onRemove: (index: number) => void;
  index: number;
  condition: QueryCondition;
};

export default function Condition(props: ConditionProps) {
  function updateField(field: string) {
    props.updateCondition(props.index, {
      field: field,
    });
  }
  function updateType(type: string) {
    props.updateCondition(props.index, {
      type: type,
    });
  }

  function updateOperator(operator: string) {
    props.updateCondition(props.index, {
      operator: operator,
    });
  }

  function updateValue(value: string | number | Date) {
    props.updateCondition(props.index, {
      value: value,
    });
  }

  return (
    <>
      <FieldSelector
        availableFields={props.availableFields}
        selectedField={props.condition.field}
        updateField={updateField}
        updateType={updateType}
        updateValue={updateValue}
      />
      {props.condition.field && (
        <OperatorSelector
          selectedOperator={props.condition.operator}
          type={props.condition.type}
          updateOperator={updateOperator}
        />
      )}
      {props.condition.operator && (
        <ValueSelector
          value={props.condition.value}
          type={props.condition.type}
          updateValue={updateValue}
          renderTwoInputs={props.condition.operator === "BETWEEN"}
        />
      )}
    </>
  );
}

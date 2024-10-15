import { React } from "jimu-core";
import { TextInput, NumericInput } from "jimu-ui";
import { DatePicker } from "jimu-ui/basic/date-picker";
import { ReactElement } from "react";

export default function ValueSelector({
  type,
  updateValue,
}: {
  type: string;
  updateValue: (value: string | number | Date) => void;
}) {
  let inputElement: ReactElement;

  function handleValueChange(valueSelected: string | number | Date) {
    updateValue(valueSelected);
  }

  switch (type) {
    case "STRING":
      inputElement = <TextInput onAcceptValue={handleValueChange} />;
      break;
    case "NUMBER":
      inputElement = <NumericInput onAcceptValue={handleValueChange} />;
      break;
    case "DATE":
      inputElement = (
        <DatePicker
          runtime
          onChange={handleValueChange}
          selectedDate={new Date()}
        />
      );
  }

  return inputElement;
}

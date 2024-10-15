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

  function handleValueChange(
    valueSelected: string | number | Date,
    type: string
  ) {
    if (type === "date") {
      const date = new Date(valueSelected);
      const isoString = date.toISOString();
      updateValue(`'${isoString}'`);
    } else {
      updateValue(valueSelected);
    }
  }

  switch (type) {
    case "STRING":
      inputElement = (
        <TextInput
          onAcceptValue={(value) => handleValueChange(value, "text")}
        />
      );
      break;
    case "NUMBER":
      inputElement = (
        <NumericInput
          onAcceptValue={(value) => handleValueChange(value, "number")}
        />
      );
      break;
    case "DATE":
      inputElement = (
        <DatePicker
          runtime
          onChange={(value) => handleValueChange(value, "date")}
          selectedDate={new Date()}
        />
      );
  }

  return inputElement;
}

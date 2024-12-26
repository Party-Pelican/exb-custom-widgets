import { React } from "jimu-core";
import { TextInput, NumericInput } from "jimu-ui";
import { DatePicker } from "jimu-ui/basic/date-picker";
import { ReactElement, useRef, useState } from "react";

export default function ValueSelector({
  value,
  type,
  updateValue,
  renderTwoInputs = false,
}: {
  value: string | number | Date;
  type: string;
  updateValue: (value: string | number | Date) => void;
  renderTwoInputs?: boolean;
}) {
  let inputElement: ReactElement;
  const [date1, setDate1] = useState<Date>(new Date());
  const [date2, setDate2] = useState<Date>(new Date());

  function handleValueChange(
    valueSelected: string | number | Date,
    type: string
  ) {
    if (renderTwoInputs) {
      if (type === "date") {
        const firstDate = new Date(valueSelected).toISOString();
        const secondDate = date2.toISOString();
        updateValue(`'${firstDate}' AND '${secondDate}'`);
        setDate1(new Date(valueSelected as number));
      } else if (type === "date2") {
        const firstDate = date1.toISOString();
        const secondDate = new Date(valueSelected).toISOString();
        updateValue(`'${firstDate}' AND '${secondDate}'`);
        setDate2(new Date(valueSelected as number));
      }
    } else {
      if (type === "date") {
        const date = new Date(valueSelected);
        const isoString = date.toISOString();
        updateValue(`'${isoString}'`);
        setDate1(new Date(valueSelected as number));
      } else if (type === "text") {
        updateValue(`'${valueSelected}'`);
      } else {
        {
          updateValue(valueSelected);
        }
      }
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
        <>
          <NumericInput
            onAcceptValue={(value) => handleValueChange(value, "number")}
          />
          {renderTwoInputs && (
            <NumericInput
              onAcceptValue={(value) => handleValueChange(value, "number2")}
            />
          )}
        </>
      );
      break;

    case "DATE":
      inputElement = (
        <>
          <DatePicker
            runtime
            onChange={(value) => handleValueChange(value, "date")}
            selectedDate={date1}
          />
          {renderTwoInputs && (
            <DatePicker
              runtime
              onChange={(value) => handleValueChange(value, "date2")}
              selectedDate={date2}
            />
          )}
        </>
      );
      break;
  }

  return inputElement;
}

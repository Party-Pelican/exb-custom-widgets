import {
  DataSource,
  QueriableDataSource,
  React,
  SqlQueryParams,
} from "jimu-core";
import { Button } from "jimu-ui";
import { useState } from "react";
import Condition from "./condition";

export type QueryCondition = Partial<{
  field: string;
  operator: string;
  value: string | number | Date;
  type: string;
  logicOperator: string;
}>;

export type JimuField = {
  alias: string;
  esriType: string;
  jimuName: string;
  name: string;
  type: string;
};

type ConditionControllerProps = {
  fields: JimuField[];
  selectedDataSource: DataSource;
  widgetId: string;
};

const buildEsriQuery = (conditions) => {
  let query = "";

  conditions.forEach((condition, index) => {
    const { field, operator, value, logicOperator } = condition;
    let conditionString = "";

    // Handle special operators like BETWEEN
    if (operator === "BETWEEN") {
      const [val1, val2] = value.split(" AND "); // Assuming value is stored as 'x AND y'
      conditionString = `${field} BETWEEN ${val1} AND ${val2}`;
    }
    // Handle LIKE operator for partial matches
    else if (operator === "LIKE") {
      conditionString = `${field} LIKE '%${value}%'`;
    }
    // Handle IS NULL / IS NOT NULL
    else if (operator === "IS NULL" || operator === "IS NOT NULL") {
      conditionString = `${field} ${operator}`;
    }
    // General case for standard operators
    else {
      conditionString = `${field} ${operator} ${value}`;
    }

    // Append the condition to the query
    query += conditionString;

    // If it's not the last condition, add the logic operator (AND/OR)
    if (index < conditions.length - 1) {
      query += ` ${logicOperator} `;
    }
  });

  return query;
};

function isValidQuery(queryString: string) {
  // Step 1: Split the query string into parts
  const queryParts = queryString.split(" ");
  console.log(queryParts);

  // Step 2: Process in chunks of three
  for (let i = 0; i < queryParts.length; i += 3) {
    const field = queryParts[i];
    const operator = queryParts[i + 1];
    const value = queryParts[i + 2]; // Can be null or undefined, so we don't check this strictly
    console.log(field, operator, value);

    // Step 3: Validate the field and operator (these cannot be null or undefined)
    if (!field || !operator || field === "null" || operator === "null") {
      return false; // Invalid query if field or operator is missing
    }

    // Optional: You can add additional validations here if needed for specific cases
  }

  // All chunks are valid
  return true;
}

export default function ConditionController(props: ConditionControllerProps) {
  const [conditions, setConditions] = useState<QueryCondition[]>([
    {
      field: null,
      operator: null,
      value: null,
      type: null,
      logicOperator: null,
    },
  ]);

  // Update the available fields when a field is selected
  const usedFields = conditions.map((cond) => cond.field).filter(Boolean);
  const availableFields = props.fields.filter(
    (field) => !usedFields.includes(field.name)
  );

  const esriQuery = buildEsriQuery(conditions);

  if (isValidQuery(esriQuery)) {
    (props.selectedDataSource as QueriableDataSource)
      .load(
        {
          where: esriQuery,
        } as SqlQueryParams,
        {
          widgetId: props.widgetId,
        }
      )
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function addCondition(newCondition: QueryCondition) {
    setConditions((prevConditions) => {
      // If there is at least one condition in the array
      if (prevConditions.length > 0) {
        // Update the last condition's logicOperator to "AND" or "OR" (based on your need)
        const updatedConditions = prevConditions.map((condition, index) => {
          if (index === prevConditions.length - 1) {
            return {
              ...condition,
              logicOperator: newCondition.logicOperator || "AND",
            };
          }
          return condition;
        });

        // Add the new condition with no logicOperator (or with a default one)
        return [...updatedConditions, { ...newCondition, logicOperator: null }];
      } else {
        // If no previous conditions, just add the new one
        return [...prevConditions, newCondition];
      }
    });
  }

  const updateCondition = (index: number, updatedCondition: QueryCondition) => {
    console.log("Updating", index, updatedCondition);

    setConditions((prevState) => {
      const updatedConditions = prevState.map((condition, idx) =>
        idx === index ? { ...condition, ...updatedCondition } : condition
      );
      return updatedConditions;
    });
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, idx) => idx !== index);
    setConditions(updatedConditions);
  };

  return (
    <>
      <div className="border border-grey p-2 mb-2">
        {conditions.map((condition, index) => (
          <Condition
            key={props.selectedDataSource.id + index}
            index={index}
            condition={condition}
            availableFields={availableFields}
            updateCondition={updateCondition}
            onRemove={removeCondition}
          />
        ))}
      </div>

      {availableFields.length > 0 && (
        <>
          <Button
            onClick={() =>
              addCondition({
                field: null,
                operator: null,
                value: null,
                type: null,
                logicOperator: "AND",
              })
            }
          >
            AND
          </Button>
          <Button
            onClick={() =>
              addCondition({
                field: null,
                operator: null,
                value: null,
                type: null,
                logicOperator: "OR",
              })
            }
          >
            OR
          </Button>
        </>
      )}
    </>
  );
}

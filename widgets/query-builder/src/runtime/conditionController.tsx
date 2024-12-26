import {
  DataSource,
  FeatureLayerDataSource,
  QueriableDataSource,
  React,
  SqlQueryParams,
} from "jimu-core";
import { Button } from "jimu-ui";
import { useState } from "react";
import Condition from "./condition";
import * as sql from "@arcgis/core/core/sql.js";
import { error } from "console";

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

function buildEsriQuery(conditions) {
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
}

export default function ConditionController(props: ConditionControllerProps) {
  const [conditions, setConditions] = useState<QueryCondition[]>([
    {
      field: null,
      operator: null,
      value: "",
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

  sql
    .parseWhereClause(
      esriQuery,
      (props.selectedDataSource as FeatureLayerDataSource).layer.fieldsIndex
    )
    .then((result) => {
      if (result.isStandardized) {
        (props.selectedDataSource as QueriableDataSource).updateQueryParams(
          {
            where: esriQuery,
          } as SqlQueryParams,
          props.widgetId
        );
        // (props.selectedDataSource as QueriableDataSource).load(
        //   {
        //     where: esriQuery,
        //   } as SqlQueryParams,
        //   {
        //     widgetId: props.widgetId,
        //   }
        // );
      }
    })
    .catch((error) => {
      console.log("Invalid query:", error.message);
    });

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

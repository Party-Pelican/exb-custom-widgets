import { React } from "jimu-core";
import { TextArea, ValidityResult } from "jimu-ui";
import { parseWhereClause } from "@arcgis/core/core/sql.js";
import FieldsIndex from "@arcgis/core/layers/support/FieldsIndex.js";

type SQLFormProps = {
  fieldsIndex: FieldsIndex;
  updateSQL: (v) => void;
  onValidityChange: (isValid: boolean) => void;
};

export default function SQLForm({
  fieldsIndex,
  updateSQL,
  onValidityChange,
}: SQLFormProps) {
  async function checkWhereClause(
    sql: string,
    fieldsIndex: FieldsIndex,
  ): Promise<ValidityResult> {
    try {
      const parsedSQL = await parseWhereClause(sql, fieldsIndex);
      if (parsedSQL.isStandardized) {
        onValidityChange(true);
        return {
          valid: true,
          msg: null,
        };
      } else {
        onValidityChange(false);
        return {
          valid: false,
          msg: "Invalid SQL syntax",
        };
      }
    } catch (e) {
      onValidityChange(false);
      const message = e instanceof Error ? e.message : "Invalid SQL syntax";
      console.error("Error parsing SQL:", e);
      return {
        valid: false,
        msg: message,
      };
    }
  }

  return (
    <TextArea
      style={{ maxWidth: "50vw", overflowX: "auto" }}
      onAcceptValue={(value) => checkWhereClause(value, fieldsIndex)}
      onChange={(e) => updateSQL(e.target.value)}
    ></TextArea>
  );
}

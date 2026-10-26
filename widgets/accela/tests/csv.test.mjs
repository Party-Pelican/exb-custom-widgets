import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
const source = await readFile(new URL('../widget/src/runtime/csv.ts', import.meta.url), 'utf8')
const { toCsv } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'))

test('CSV exports exactly requested columns with Unicode, commas, quotes, and newlines', () => {
  const csv = toCsv([{permitId:'BLD-001',status:'Issued',description:'Café, "addition"\nSecond line'}])
  assert.equal(csv, '\uFEFF"Permit ID","Status","Description"\r\n"BLD-001","Issued","Café, ""addition""\nSecond line"')
})
test('CSV neutralizes spreadsheet formulas including leading whitespace', () => {
  const csv = toCsv([{permitId:'=1+1',status:' @SUM(A1)',description:'\t+CMD'}])
  assert.ok(csv.includes('"\'=1+1"'))
  assert.ok(csv.includes('"\' @SUM(A1)"'))
  assert.ok(csv.includes('"\'\t+CMD"'))
})

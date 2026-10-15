// File downloads for the Export menus: CSV, and Excel as SpreadsheetML (opens in Excel, no library needed).

type Cell = string | number | null | undefined

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement("a"), { href: url, download: filename })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, header: string[], rows: Cell[][]) {
  const escape = (v: Cell) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n")
  download("﻿" + csv, "text/csv;charset=utf-8", `${filename}.csv`)
}

export function downloadExcel(filename: string, sheet: string, header: string[], rows: Cell[][]) {
  const xml = (v: Cell) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  const cell = (v: Cell, style?: string) =>
    `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="${typeof v === "number" ? "Number" : "String"}">${xml(v)}</Data></Cell>`
  const body = [
    `<Row>${header.map((h) => cell(h, "head")).join("")}</Row>`,
    ...rows.map((r) => `<Row>${r.map((v) => cell(v)).join("")}</Row>`),
  ].join("")
  const doc = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="head"><Font ss:Bold="1"/></Style></Styles>
<Worksheet ss:Name="${xml(sheet).slice(0, 31)}"><Table>${body}</Table></Worksheet></Workbook>`
  download(doc, "application/vnd.ms-excel", `${filename}.xls`)
}

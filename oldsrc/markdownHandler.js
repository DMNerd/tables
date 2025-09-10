import { markdownTable } from "markdown-table";
import { populateRow, createHeaderCell } from "./tableEditor.js";
import { sanitizeInput } from "./utils.js";

function generateMarkdown() {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");

  const headers = Array.from(tableHeaders.rows[0].cells).map((cell) =>
    sanitizeInput(cell.firstChild?.value.trim() || ""),
  );

  const rows = Array.from(tableRows.rows).map((row) =>
    Array.from(row.cells).map((cell) =>
      sanitizeInput(cell.firstChild?.value.trim() || ""),
    ),
  );

  return markdownTable([headers, ...rows]);
}

function populateTableFromMarkdown(markdown) {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");
  const lines = markdown.trim().split("\n");
  if (lines.length < 2) return;

  clearTable();

  const headers = lines[0]
    .replace(/^|\s*$/g, "")
    .split("|")
    .map((cell) => cell.trim());
  const maxColumns = headers.length;

  headers.forEach((header, i) => {
    if (!tableHeaders.rows[0].cells[i]) {
      tableHeaders.rows[0].appendChild(createHeaderCell(i + 1));
    }
    tableHeaders.rows[0].cells[i].firstChild.value = header;
  });

  lines.slice(2).forEach((line) => {
    const rowData = line
      .replace(/^|\s*$/g, "")
      .split("|")
      .map((cell) => cell.trim());
    const newRow = tableRows.insertRow();
    populateRow(newRow, maxColumns);
    rowData.forEach((data, i) => {
      newRow.cells[i].firstChild.value = data;
    });
  });
}

function clearTable() {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");
  tableHeaders.innerHTML =
    '<tr><th><input type="text" placeholder="Header 1" id="header1"></th></tr>';
  tableRows.innerHTML = "";
}

export { generateMarkdown, populateTableFromMarkdown };

import { cleanText, showError, sanitizeInput } from "./utils.js";

function addRow() {
  const tableRows = document.getElementById("inputTableRows");
  const tableHeaders = document.getElementById("inputTable");
  const newRow = tableRows.insertRow();
  populateRow(newRow, tableHeaders.rows[0].cells.length);
}

function addColumn() {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");
  const columnCount = tableHeaders.rows[0].cells.length + 1;
  tableHeaders.rows[0].appendChild(createHeaderCell(columnCount));
  Array.from(tableRows.rows).forEach((row, i) => {
    createCell(row, i + 1, columnCount);
  });
}

function deleteRow() {
  const tableRows = document.getElementById("inputTableRows");
  if (tableRows.rows.length) {
    tableRows.deleteRow(-1);
  } else {
    showError("No rows to delete.");
  }
}

function deleteColumn() {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");
  if (tableHeaders.rows[0].cells.length > 1) {
    Array.from([tableHeaders.rows[0], ...tableRows.rows]).forEach((row) =>
      row.deleteCell(-1),
    );
  } else {
    showError("No columns to delete.");
  }
}

function populateRow(row, columnCount) {
  const tableRows = document.getElementById("inputTableRows");
  for (let i = 1; i <= columnCount; i++) {
    createCell(row, tableRows.rows.length, i);
  }
}

function createCell(row, rowIndex, columnIndex) {
  const cell = row.insertCell();
  const input = createInput(
    `Ř ${rowIndex}, S ${columnIndex}`,
    `row${rowIndex}col${columnIndex}`,
  );
  cell.appendChild(input);
}

function createHeaderCell(columnIndex) {
  const cell = document.createElement("th");
  cell.appendChild(
    createInput(`Nadpis ${columnIndex}`, `header${columnIndex}`),
  );
  return cell;
}

function createInput(placeholder, id) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.id = id;
  return input;
}

function populateTableFromHTML(htmlTable) {
  const tableHeaders = document.getElementById("inputTable");
  const tableRows = document.getElementById("inputTableRows");

  // Clear existing table
  tableHeaders.innerHTML =
    '<tr><th><input type="text" placeholder="Header 1" id="header1"></th></tr>';
  tableRows.innerHTML = "";

  const headerRow = tableHeaders.rows[0];
  const maxColumns = Math.max(
    ...Array.from(htmlTable.rows, (row) => row.cells.length),
  );

  // Populate headers
  Array.from(htmlTable.rows[0].cells).forEach((cell, i) => {
    if (!headerRow.cells[i]) {
      headerRow.appendChild(createHeaderCell(i + 1));
    }
    headerRow.cells[i].firstChild.value = sanitizeInput(
      cleanText(cell.innerHTML),
    );
  });

  // Populate rows
  Array.from(htmlTable.rows)
    .slice(1)
    .forEach((htmlRow) => {
      if (!isRowEmpty(htmlRow)) {
        const newRow = tableRows.insertRow();
        populateRow(newRow, maxColumns);
        Array.from(htmlRow.cells).forEach((cell, cellIndex) => {
          newRow.cells[cellIndex].firstChild.value = sanitizeInput(
            cleanText(cell.innerHTML),
          );
        });
      }
    });
}

function isRowEmpty(row) {
  return Array.from(row.cells).every((cell) => !cell.textContent.trim());
}

export {
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  populateRow,
  createCell,
  createHeaderCell,
  createInput,
  populateTableFromHTML,
};

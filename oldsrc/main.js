import debounce from "debounce";

import { addRow, addColumn, deleteRow, deleteColumn } from "./tableEditor.js";
import {
  generateMarkdown,
  populateTableFromMarkdown,
} from "./markdownHandler.js";
import { handleFileUpload, loadSelectedTable } from "./fileHandler.js";
import { clearInputs, getEl } from "./utils.js";
import "./icons.js";

document.addEventListener("DOMContentLoaded", () => {
  const output = getEl("output");
  const fileInput = getEl("fileInput");
  const tableSelector = getEl("tableSelector");
  const clearInputsBtn = getEl("clearInputsBtn");

  getEl("addRowBtn").addEventListener("click", addRow);
  getEl("addColumnBtn").addEventListener("click", addColumn);
  getEl("deleteRowBtn").addEventListener("click", deleteRow);
  getEl("deleteColumnBtn").addEventListener("click", deleteColumn);
  getEl("generateMarkdownBtn").addEventListener("click", () => {
    output.value = generateMarkdown();
  });

  clearInputsBtn.addEventListener("click", clearInputs);
  fileInput.addEventListener("change", debounce(handleFileUpload, 500));
  tableSelector.addEventListener("change", debounce(loadSelectedTable, 150));
  output.addEventListener(
    "input",
    debounce(() => populateTableFromMarkdown(output.value), 300),
  );
});

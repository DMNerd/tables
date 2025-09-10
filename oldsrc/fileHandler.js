import mammoth from "mammoth";

import { populateTableFromHTML } from "./tableEditor.js";
import { showError } from "./utils.js";

window.mammoth = mammoth;

let storedTables = [];

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (fileName.endsWith(".docx")) {
          processDocxFile(e.target.result);
        } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
          processHtmlFile(e.target.result);
        } else {
          showError("Please select a DOCX or HTML file.");
        }
      } catch (error) {
        console.error("File processing error:", error);
        showError(
          "Error processing the file. Please ensure it contains tables.",
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

async function processDocxFile(arrayBuffer) {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const sanitizedHtml = DOMPurify.sanitize(result.value, {
      ADD_TAGS: ["table", "tr", "td", "th"],
    });
    const docHtml = new DOMParser().parseFromString(sanitizedHtml, "text/html");
    loadTablesFromHtml(docHtml.querySelectorAll("table"), "DOCX");
  } catch (error) {
    console.error("Error converting DOCX to HTML:", error);
    showError("An error occurred while processing the DOCX file.");
  }
}

function processHtmlFile(htmlText) {
  const sanitizedHtml = DOMPurify.sanitize(htmlText, {
    ADD_TAGS: ["table", "tr", "td", "th"],
  });
  const docHtml = new DOMParser().parseFromString(sanitizedHtml, "text/html");
  loadTablesFromHtml(docHtml.querySelectorAll("table"), "HTML");
}

function loadTablesFromHtml(tables, fileType) {
  storedTables = Array.from(tables);
  if (storedTables.length > 0) {
    populateTableSelector(storedTables, fileType);
    loadSelectedTable();
  } else {
    showError(`No valid tables found in the ${fileType} file.`);
  }
}

function populateTableSelector(tables, fileType) {
  const tableSelector = document.getElementById("tableSelector");
  document.querySelector('label[for="tableSelector"]').textContent =
    `Select a table from the uploaded ${fileType} file:`;
  tableSelector.innerHTML = tables
    .map((_, i) => `<option value="${i}">Table ${i + 1}</option>`)
    .join("");
  tableSelector.disabled = false;
}

function loadSelectedTable() {
  const tableSelector = document.getElementById("tableSelector");
  const selectedTable = storedTables[tableSelector.value];
  if (selectedTable) populateTableFromHTML(selectedTable);
}

export { handleFileUpload, loadSelectedTable };

import Swal from "sweetalert2";
import DOMPurify from "dompurify";

export function sanitizeInput(input) {
  return DOMPurify.sanitize(input);
}

function cleanText(text) {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clearInputs() {
  const inputs = document.querySelectorAll(
    "#inputTable input, #inputTableRows input",
  );
  inputs.forEach((input) => (input.value = ""));
}

function getEl(id) {
  return document.getElementById(id);
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}

export { cleanText, showError, clearInputs, getEl };

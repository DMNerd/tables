document.addEventListener('DOMContentLoaded', () => {
    console.log('SweetAlert2:', typeof Swal !== 'undefined' ? 'Loaded' : 'Not Loaded');
    console.log('Mammoth:', typeof mammoth !== 'undefined' ? 'Loaded' : 'Not Loaded');

    const tableHeaders = document.getElementById('inputTable'),
          tableRows = document.getElementById('inputTableRows'),
          output = document.getElementById('output'),
          addRowBtn = document.getElementById('addRowBtn'),
          addColumnBtn = document.getElementById('addColumnBtn'),
          generateMarkdownBtn = document.getElementById('generateMarkdownBtn'),
          fileInput = document.getElementById('fileInput'),
          tableSelector = document.getElementById('tableSelector');

    let storedTables = [];

    addRowBtn.addEventListener('click', addRow);
    addColumnBtn.addEventListener('click', addColumn);
    generateMarkdownBtn.addEventListener('click', () => {
        output.value = generateMarkdown();
    });
    fileInput.addEventListener('change', handleFileUpload);
    tableSelector.addEventListener('change', loadSelectedTable);
    output.addEventListener('input', () => populateTableFromMarkdown(output.value));

    function addRow() {
        const newRow = tableRows.insertRow();
        for (let i = 0; i < tableHeaders.rows[0].cells.length; i++) {
            createCell(newRow, `Řádek ${tableRows.rows.length}, Sloupec ${i + 1}`);
        }
    }

    function addColumn() {
        for (let row of tableHeaders.rows) {
            createCell(row, `Nadpis ${row.cells.length + 1}`);
        }
        for (let row of tableRows.rows) {
            createCell(row, `Řádek ${row.rowIndex + 1}, Sloupec ${row.cells.length + 1}`);
        }
    }

    function createCell(row, placeholder) {
        const cell = row.insertCell();
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        cell.appendChild(input);
    }

    function generateMarkdown() {
        const headerLine = '| ' + Array.from(tableHeaders.rows[0].cells).map(cell => (cell.firstChild?.value || '').replace(/\n/g, ' / ')).join(' | ') + ' |';
        const separatorLine = '| ' + Array.from(tableHeaders.rows[0].cells).map(() => '---').join(' | ') + ' |';
        const rowLines = Array.from(tableRows.rows).map(row => '| ' + Array.from(row.cells).map(cell => (cell.firstChild?.value || '').replace(/\n/g, ' / ')).join(' | ') + ' |');
        return [headerLine, separatorLine, ...rowLines].join('\n') + '\n';
    }

    function populateTableFromMarkdown(markdown) {
        const lines = markdown.trim().split('\n');
        if (lines.length < 2) return;
        const headerData = lines[0].split('|').map(cell => cell.trim()).filter(Boolean);
        const rowData = lines.slice(2).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
        clearTable();

        for (let i = 0; i < headerData.length; i++) {
            if (tableHeaders.rows[0].cells[i]) {
                tableHeaders.rows[0].cells[i].firstChild.value = headerData[i].replace(/ \/ /g, " ");
            }
        }

        rowData.forEach((row, rowIndex) => {
            const newRow = tableRows.insertRow();
            row.forEach((cellData, cellIndex) => {
                createCell(newRow, `Řádek ${rowIndex + 1}, Sloupec ${cellIndex + 1}`);
                if (newRow.cells[cellIndex]) {
                    newRow.cells[cellIndex].firstChild.value = cellData.replace(/ \/ /g, " ");
                }
            });
        });
    }

    function clearTable() {
        tableHeaders.innerHTML = '<tr><th><input type="text" placeholder="Nadpis 1"></th><th><input type="text" placeholder="Nadpis 2"></th><th><input type="text" placeholder="Nadpis 3"></th></tr>';
        tableRows.innerHTML = '';
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = e => {
                processDocxFile(e.target.result, file.name);
                fileInput.value = '';
            };
            reader.readAsArrayBuffer(file);
        } else {
            showError('Prosím vyberte DOCX soubor obsahující tabulku.');
        }
    }

    function processDocxFile(arrayBuffer, fileName) {
        mammoth.convertToHtml({ arrayBuffer }).then(result => {
            const docHtml = new DOMParser().parseFromString(result.value, 'text/html');
            const tables = docHtml.querySelectorAll('table');
            storedTables = Array.from(tables);
            if (storedTables.length > 0) {
                populateTableSelector(storedTables, fileName);
                loadSelectedTable();
            } else {
                showError('V souboru nebyla nalezena validní tabulka.');
            }
        }).catch(error => {
            console.error("Error processing DOCX file:", error);
            showError('Chyba zpracování souboru.');
        });
    }

    function populateTableSelector(tables, fileName) {
        document.querySelector('label[for="tableSelector"]').textContent = `Vyberte tabulku z nahraného souboru ${fileName}:`;
        tableSelector.innerHTML = tables.map((table, index) => `<option value="${index}">Tabulka ${index + 1}</option>`).join('');
        tableSelector.disabled = false;
    }

    function loadSelectedTable() {
        const selectedTableIndex = tableSelector.value;
        if (selectedTableIndex !== '') {
            clearTable();
            const htmlTable = storedTables[selectedTableIndex];
            const headerRow = tableHeaders.rows[0];
            let maxColumns = 0;
    
            Array.from(htmlTable.rows).forEach(row => {
                if (row.cells.length > maxColumns) {
                    maxColumns = row.cells.length;
                }
            });
    
            while (headerRow.cells.length < maxColumns) {
                createCell(headerRow, `Nadpis ${headerRow.cells.length + 1}`);
            }
    
            Array.from(htmlTable.rows[0].cells).forEach((cell, cellIndex) => {
                if (headerRow.cells[cellIndex]) {
                    const cellText = cleanText(cell.innerHTML);
                    headerRow.cells[cellIndex].firstChild.value = cellText;
                }
            });
    
            Array.from(htmlTable.rows).slice(1).forEach((htmlRow, rowIndex) => {
                const newRow = tableRows.insertRow();
                const totalCells = htmlRow.cells.length;
    
                const leftPadding = Math.floor((maxColumns - totalCells) / 2);
                const rightPadding = maxColumns - totalCells - leftPadding;
    
                for (let i = 0; i < leftPadding; i++) {
                    createCell(newRow, `Row ${rowIndex + 1}, Column ${i + 1}`);
                }
    
                Array.from(htmlRow.cells).forEach((cell, cellIndex) => {
                    createCell(newRow, `Row ${rowIndex + 1}, Column ${leftPadding + cellIndex + 1}`);
                    const cellText = cleanText(cell.innerHTML);
                    newRow.cells[leftPadding + cellIndex].firstChild.value = cellText;
                });
    
                for (let i = 0; i < rightPadding; i++) {
                    createCell(newRow, `Row ${rowIndex + 1}, Column ${leftPadding + totalCells + i + 1}`);
                }
            });
        }
    }
    function cleanText(text) {
        return text
            .replace(/&nbsp;/g, ' ')                 // Replace non-breaking spaces with regular spaces
            .replace(/<br\s*\/?>/gi, " ")            // Replace line breaks with a space
            .replace(/<\/?[^>]+(>|$)/g, " ")         // Remove any remaining HTML tags
            .replace(/\s+/g, ' ')                    // Replace multiple spaces with a single space
            .trim();                                 // Trim leading and trailing spaces
    }
    function showError(message) {
        swal.fire({ icon: 'error', title: 'Chyba', text: message, confirmButtonText: 'OK' });
    }
});

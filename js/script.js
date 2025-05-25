document.addEventListener('DOMContentLoaded', function() {
    // Show the 'Nuevo/Editar Contrato' section by default on page load
    showSection('nuevo-editar-contrato');

    // Attach event listeners for form actions
    document.getElementById('guardarActualizarContrato').addEventListener('click', function() {
        alert('Contrato guardado/actualizado (funcionalidad de backend no implementada en este ejemplo).');
        // AQUI VA LA LOGICA PARA RECOLECTAR LOS DATOS DEL FORMULARIO Y ENVIARLOS A UN SERVIDOR
        // Por ejemplo:
        // const contractData = collectContractFormData();
        // saveContract(contractData);
    });

    document.getElementById('limpiarFormulario').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el formulario?')) {
            clearContractForm();
        }
    });

    // Event listener for Avance Físico Save button
    const guardarAvanceButton = document.getElementById('guardarAvance');
    if (guardarAvanceButton) {
        guardarAvanceButton.addEventListener('click', function() {
            alert('Avance físico guardado (funcionalidad de backend no implementada en este ejemplo).');
            // AQUI VA LA LOGICA PARA RECOLECTAR LOS DATOS DEL AVANCE FÍSICO Y ENVIARLOS A UN SERVIDOR
            // Por ejemplo:
            // const avanceData = collectAvanceFisicoData();
            // saveAvanceFisico(avanceData);
        });
    }

    // Initialize totals for existing rows on load (if any)
    document.querySelectorAll('#partidasTableBody tr').forEach(row => {
        calculateTotal(row.querySelector('.quantity-input') || row.querySelector('.unit-price-input'));
    });

    // Automatically calculate Monto Total del Contrato
    const montoOriginalInput = document.getElementById('montoOriginal');
    const montoModificadoInput = document.getElementById('montoModificado');
    const montoTotalContratoInput = document.getElementById('montoTotalContrato');

    function updateMontoTotalContrato() {
        const original = parseFloat(montoOriginalInput.value) || 0;
        const modificado = parseFloat(montoModificadoInput.value) || 0;
        montoTotalContratoInput.value = (original + modificado).toFixed(2);
    }

    if (montoOriginalInput) {
        montoOriginalInput.addEventListener('input', updateMontoTotalContrato);
    }
    if (montoModificadoInput) {
        montoModificadoInput.addEventListener('input', updateMontoTotalContrato);
    }
    // Call on load to ensure initial calculation if values are pre-filled
    updateMontoTotalContrato();
});

let partidaCounter = document.querySelectorAll('#partidasTableBody tr').length;

/**
 * Adds a new row to the "Partidas del Contrato" table.
 */
function addPartida() {
    partidaCounter++;
    const tableBody = document.getElementById('partidasTableBody');
    const newRow = tableBody.insertRow();
    newRow.innerHTML = `
        <td>${partidaCounter}</td>
        <td><input type="text" class="description-input" value=""></td>
        <td><input type="number" min="0" value="0" class="quantity-input" oninput="calculateTotal(this)"></td>
        <td><input type="text" class="umd-input" value=""></td>
        <td><input type="number" min="0" step="0.01" value="0.00" class="unit-price-input" oninput="calculateTotal(this)"></td>
        <td><input type="number" class="total-input" value="0.00" readonly></td>
        <td><button class="delete-button" onclick="deletePartida(this)"><i class="material-icons">delete</i></button></td>
    `;
    // Set focus to the new description input for immediate entry
    newRow.querySelector('.description-input').focus();
}

/**
 * Calculates the total for a specific partida row based on quantity and unit price.
 * @param {HTMLInputElement} inputElement - The input field that triggered the calculation (quantity or unit price).
 */
function calculateTotal(inputElement) {
    const row = inputElement.closest('tr');
    if (!row) return; // Exit if row is not found

    const quantityInput = row.querySelector('.quantity-input');
    const unitPriceInput = row.querySelector('.unit-price-input');
    const totalInput = row.querySelector('.total-input');

    const quantity = parseFloat(quantityInput.value) || 0;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const total = quantity * unitPrice;

    totalInput.value = total.toFixed(2);
}

/**
 * Deletes a partida row from the table.
 * @param {HTMLButtonElement} button - The delete button clicked.
 */
function deletePartida(button) {
    const row = button.closest('tr');
    if (!row) return; // Exit if row is not found

    if (confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
        row.remove();
        // Re-number the remaining rows to maintain sequential numbering
        const tableBody = document.getElementById('partidasTableBody');
        Array.from(tableBody.rows).forEach((r, index) => {
            r.cells[0].textContent = index + 1;
        });
        partidaCounter = tableBody.rows.length; // Update the global counter
    }
}

/**
 * Adds a new option to the "Modalidad de Contratación" dropdown.
 */
function addModalidad() {
    const newModalidad = prompt("Introduce la nueva modalidad de contratación:");
    if (newModalidad && newModalidad.trim() !== '') {
        const selectElement = document.getElementById('modalidadContratacion');
        const option = document.createElement('option');
        option.value = newModalidad.toLowerCase().replace(/\s+/g, '-'); // slugify for value
        option.textContent = newModalidad.trim();
        selectElement.appendChild(option);
        selectElement.value = option.value; // Select the newly added option
    } else if (newModalidad !== null) { // User clicked OK but entered empty string
        alert("La modalidad no puede estar vacía.");
    }
}

/**
 * Adds a new option to the "Modalidad de Contratación" dropdown in Avance Físico section.
 */
function addModalidadAvanceFisico() {
    const newModalidad = prompt("Introduce la nueva modalidad de contratación para Avance Físico:");
    if (newModalidad && newModalidad.trim() !== '') {
        const selectElement = document.getElementById('avanceFisicoModalidad');
        const option = document.createElement('option');
        option.value = newModalidad.toLowerCase().replace(/\s+/g, '-'); // slugify for value
        option.textContent = newModalidad.trim();
        selectElement.appendChild(option);
        selectElement.value = option.value; // Select the newly added option
    } else if (newModalidad !== null) {
        alert("La modalidad no puede estar vacía.");
    }
}

/**
 * Toggles the visibility of different content sections.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar .main-nav ul li a').forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // Add active class to the clicked sidebar link
    const clickedLink = document.querySelector(`.sidebar .main-nav ul li a[onclick="showSection('${sectionId}')"]`);
    if (clickedLink) {
        clickedLink.classList.add('active');
    }
}

/**
 * Clears all input fields and textarea in the "Nuevo/Editar Contrato" form.
 */
function clearContractForm() {
    document.querySelectorAll('#nuevo-editar-contrato input, #nuevo-editar-contrato select, #nuevo-editar-contrato textarea').forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = false;
        } else if (field.tagName === 'SELECT') {
            field.selectedIndex = 0; // Reset to the first option
        } else if (field.readOnly) {
            // Do not clear readonly fields that might hold calculated values,
            // or reset them to 0.00 if they are numerical totals.
            if (field.type === 'number') {
                field.value = '0.00';
            }
        }
         else {
            field.value = '';
        }
    });
    // Clear the "Partidas del Contrato" table except for the header
    const partidasTableBody = document.getElementById('partidasTableBody');
    partidasTableBody.innerHTML = ''; // Clears all rows
    partidaCounter = 0; // Reset the counter for new rows
}


// --- Modal Functions ---

/**
 * Displays the help modal.
 */
function showHelpModal() {
    document.getElementById('helpModal').style.display = 'flex';
}

/**
 * Hides the help modal.
 */
function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
}

/**
 * Displays the contract details modal with data from the clicked row.
 * @param {HTMLButtonElement} button - The "View" button clicked.
 */
function showContractDetails(button) {
    const row = button.closest('tr');
    if (!row) {
        console.error("Row not found for contract details.");
        return;
    }

    const cells = row.cells;
    const detailsContent = document.getElementById('contractDetailsContent');
    detailsContent.innerHTML = `
        <p><strong>N° Proveedor:</strong> ${cells[0].textContent}</p>
        <p><strong>N° SICAC:</strong> ${cells[1].textContent}</p>
        <p><strong>Fecha Inicio:</strong> ${cells[2].textContent}</p>
        <p><strong>Fecha Fin:</strong> ${cells[3].textContent}</p>
        <p><strong>Monto Total:</strong> ${cells[4].textContent}</p>
        <p><strong>Estatus:</strong> ${cells[5].textContent}</p>
        <p><strong>Modalidad:</strong> ${cells[6].textContent}</p>
        <p><strong>Objeto Contractual:</strong> ${cells[7].textContent}</p>
        `;
    document.getElementById('contractDetailsModal').style.display = 'flex';
}

/**
 * Hides the contract details modal.
 */
function closeContractDetailsModal() {
    document.getElementById('contractDetailsModal').style.display = 'none';
}

// Close modals if clicked outside of the modal content
window.onclick = function(event) {
    const helpModal = document.getElementById('helpModal');
    const contractDetailsModal = document.getElementById('contractDetailsModal');

    if (event.target == helpModal) {
        helpModal.style.display = "none";
    }
    if (event.target == contractDetailsModal) {
        contractDetailsModal.style.display = "none";
    }
}

// --- Future Backend Integration (Example functions - NOT implemented fully) ---
// These functions would typically interact with a server-side API

/*
function collectContractFormData() {
    const formData = {};
    document.querySelectorAll('#nuevo-editar-contrato input, #nuevo-editar-contrato select, #nuevo-editar-contrato textarea').forEach(field => {
        if (field.id) {
            formData[field.id] = field.value;
        }
    });

    const partidas = [];
    document.querySelectorAll('#partidasTableBody tr').forEach(row => {
        partidas.push({
            description: row.querySelector('.description-input').value,
            quantity: parseFloat(row.querySelector('.quantity-input').value) || 0,
            umd: row.querySelector('.umd-input').value,
            unitPrice: parseFloat(row.querySelector('.unit-price-input').value) || 0,
            total: parseFloat(row.querySelector('.total-input').value) || 0,
        });
    });
    formData.partidas = partidas;
    return formData;
}

function saveContract(data) {
    console.log("Saving contract data:", data);
    // Example: fetch('/api/contracts', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    //     .then(response => response.json())
    //     .then(result => {
    //         console.log('Contract saved:', result);
    //         alert('Contrato guardado exitosamente!');
    //         // Optionally refresh contract list
    //     })
    //     .catch(error => {
    //         console.error('Error saving contract:', error);
    //         alert('Error al guardar el contrato.');
    //     });
}

function collectAvanceFisicoData() {
    const formData = {};
    document.querySelectorAll('#avance-fisico input, #avance-fisico select, #avance-fisico textarea').forEach(field => {
        if (field.id) {
            formData[field.id] = field.value;
        }
    });
    // Add logic to collect data from any potential advance table if it existed
    return formData;
}

function saveAvanceFisico(data) {
    console.log("Saving avance físico data:", data);
    // Example: fetch('/api/avance-fisico', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    //     .then(response => response.json())
    //     .then(result => {
    //         console.log('Avance físico saved:', result);
    //         alert('Avance físico guardado exitosamente!');
    //     })
    //     .catch(error => {
    //         console.error('Error saving avance físico:', error);
    //         alert('Error al guardar el avance físico.');
    //     });
}
*/
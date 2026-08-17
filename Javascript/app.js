// Global State with default pre-populated items
let lineItems = [
  { description: 'Diagnostic System Inspection', qty: 1, rate: 85.00 },
  { description: 'Replace Capacitor & System Tune-Up', qty: 2, rate: 120.00 }
];

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('previewDate').innerText = new Date().toLocaleDateString();
  setupEventListeners();
  renderLineItemInputs();
  renderInvoicePreview();
});

// Attach event listeners via JS (Cleaned & Unified)
function setupEventListeners() {
  const inputIds = ['companyName', 'clientName', 'invoiceNum', 'taxRate', 'discountRate', 'paymentNotes'];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderInvoicePreview);
  });

  document.getElementById('btnAddItem').addEventListener('click', addLineItem);
  document.getElementById('btnSaveProfile').addEventListener('click', saveToLocalStorage);
  document.getElementById('btnExportPdf').addEventListener('click', generatePDF);
  document.getElementById('logoInput').addEventListener('change', handleLogoUpload);
}

// Logo File Handler
function handleLogoUpload(event) {
  const file = event.target.files[0];
  const logoImg = document.getElementById('previewLogo');

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      logoImg.src = e.target.result;
      logoImg.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    logoImg.src = '';
    logoImg.classList.add('hidden');
  }
}

// Helper: Standardized Currency Formatter
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Render dynamic input rows in control panel
function renderLineItemInputs() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  if (lineItems.length === 0) {
    const emptyNotice = document.createElement('p');
    emptyNotice.className = 'text-xs text-slate-400 italic text-center py-2';
    emptyNotice.innerText = 'No items added. Click "+ Add Item" above.';
    container.appendChild(emptyNotice);
    return;
  }

  lineItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'item-row flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200';

    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.value = item.description;
    descInput.placeholder = 'Description';
    descInput.className = 'flex-1 text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500';
    descInput.addEventListener('input', (e) => updateItem(index, 'description', e.target.value));

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.value = item.qty;
    qtyInput.placeholder = 'Qty';
    qtyInput.className = 'w-14 text-xs p-1.5 border border-slate-300 rounded outline-none text-center focus:border-emerald-500';
    qtyInput.addEventListener('input', (e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0));

    const rateInput = document.createElement('input');
    rateInput.type = 'number';
    rateInput.value = item.rate;
    rateInput.placeholder = 'Rate';
    rateInput.className = 'w-20 text-xs p-1.5 border border-slate-300 rounded outline-none text-right focus:border-emerald-500';
    rateInput.addEventListener('input', (e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0));

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.className = 'text-slate-400 hover:text-red-500 font-bold px-1 text-base leading-none';
    deleteBtn.addEventListener('click', () => removeItem(index));

    row.appendChild(descInput);
    row.appendChild(qtyInput);
    row.appendChild(rateInput);
    row.appendChild(deleteBtn);

    container.appendChild(row);
  });
}

function updateItem(index, field, value) {
  lineItems[index][field] = value;
  renderInvoicePreview();
}

function addLineItem() {
  lineItems.push({ description: 'New Service Item', qty: 1, rate: 50.00 });
  renderLineItemInputs();
  renderInvoicePreview();
}

function removeItem(index) {
  lineItems.splice(index, 1);
  renderLineItemInputs();
  renderInvoicePreview();
}

// Render Preview Canvas (Single Consolidated Function)
function renderInvoicePreview() {
  document.getElementById('previewCompany').innerText = document.getElementById('companyName').value || 'Your Company Name';
  document.getElementById('previewClient').innerText = document.getElementById('clientName').value || 'Client Name';
  document.getElementById('previewInvoiceNum').innerText = document.getElementById('invoiceNum').value || 'INV-000';

  const tableBody = document.getElementById('previewTableBody');
  tableBody.innerHTML = '';

  let subtotal = 0;

  if (lineItems.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" class="empty-table-msg">No line items added to this quote yet.</td>`;
    tableBody.appendChild(tr);
  } else {
    lineItems.forEach(item => {
      const itemTotal = item.qty * item.rate;
      subtotal += itemTotal;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100';
      tr.innerHTML = `
        <td class="py-2.5 text-slate-800 font-medium">${escapeHtml(item.description || 'Service Item')}</td>
        <td class="py-2.5 text-center text-slate-600">${item.qty}</td>
        <td class="py-2.5 text-right text-slate-600">${formatCurrency(item.rate)}</td>
        <td class="py-2.5 text-right text-slate-800 font-semibold">${formatCurrency(itemTotal)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Math Calculations
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
  const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;

  const discountAmount = subtotal * (discountRate / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + taxAmount;

  // Update Notes
  const notesElem = document.getElementById('previewNotes');
  if (notesElem) {
    notesElem.innerText = document.getElementById('paymentNotes').value || '';
  }

  // Canvas Totals Updates
  document.getElementById('subtotalVal').innerText = formatCurrency(subtotal);
  
  // Optional Discount Row Handler (if element exists on canvas)
  const discountElem = document.getElementById('discountVal');
  if (discountElem) {
    discountElem.innerText = `-${formatCurrency(discountAmount)}`;
  }

  document.getElementById('taxVal').innerText = formatCurrency(taxAmount);
  document.getElementById('totalVal').innerText = formatCurrency(total);
}

// Security Helper for HTML Escaping
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escapeMap[match];
  });
}

// Save Profile Config to LocalStorage
function saveToLocalStorage() {
  const profile = {
    companyName: document.getElementById('companyName').value,
    taxRate: document.getElementById('taxRate').value,
    discountRate: document.getElementById('discountRate').value,
    paymentNotes: document.getElementById('paymentNotes').value,
    lineItems: lineItems
  };
  localStorage.setItem('tradeBill_profile', JSON.stringify(profile));
  alert('Profile configuration saved locally!');
}

// Generate PDF Output
function generatePDF() {
  const element = document.getElementById('invoiceCanvas');
  const invoiceNum = document.getElementById('invoiceNum').value || 'Invoice';
  
  const opt = {
    margin:       0.5,
    filename:     `${invoiceNum}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}
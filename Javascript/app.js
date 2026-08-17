// State management
let lineItems = [
  { description: 'Diagnostic System Inspection', qty: 1, rate: 85 },
  { description: 'Replace Dual-Run Capacitor 45/5 MFD', qty: 1, rate: 145 }
];

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// DOM Elements
const itemsContainer = document.getElementById('itemsContainer');
const btnAddRow = document.getElementById('btnAddRow');
const btnExportPdf = document.getElementById('btnExportPdf');
const previewContainer = document.getElementById('invoicePreview');

// Inputs
const companyNameInput = document.getElementById('companyName');
const clientNameInput = document.getElementById('clientName');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const taxRateInput = document.getElementById('taxRate');
const discountRateInput = document.getElementById('discountRate');
const invoiceNotesInput = document.getElementById('invoiceNotes');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderInputs();
  renderPreview();
  attachEventListeners();
});

function attachEventListeners() {
  [companyNameInput, clientNameInput, invoiceNumberInput, taxRateInput, discountRateInput, invoiceNotesInput].forEach(input => {
    input.addEventListener('input', renderPreview);
  });

  btnAddRow.addEventListener('click', () => {
    lineItems.push({ description: '', qty: 1, rate: 0 });
    renderInputs();
    renderPreview();
  });

  btnExportPdf.addEventListener('click', exportPDF);
}

// Render dynamic input rows on control panel
function renderInputs() {
  itemsContainer.innerHTML = '';
  lineItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `
      <input type="text" placeholder="Description" value="${item.description}" data-index="${index}" data-field="description" class="row-input flex-1 text-xs border rounded px-2 py-1.5 focus:ring-1 focus:ring-emerald-500">
      <input type="number" placeholder="Qty" value="${item.qty}" data-index="${index}" data-field="qty" class="row-input w-14 text-xs border rounded px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 text-center">
      <input type="number" placeholder="Rate" value="${item.rate}" data-index="${index}" data-field="rate" class="row-input w-20 text-xs border rounded px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 text-right">
      <button type="button" onclick="removeRow(${index})" class="text-red-500 hover:text-red-700 font-bold px-1.5 text-sm">&times;</button>
    `;
    itemsContainer.appendChild(row);
  });

  // Attach input handlers to dynamic rows
  document.querySelectorAll('.row-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.dataset.index;
      const field = e.target.dataset.field;
      lineItems[idx][field] = field === 'description' ? e.target.value : parseFloat(e.target.value) || 0;
      renderPreview();
    });
  });
}

// Global functions for inline onclick handlers
window.removeRow = function(index) {
  lineItems.splice(index, 1);
  renderInputs();
  renderPreview();
};

window.addPreset = function(description, qty, rate) {
  lineItems.push({ description, qty, rate });
  renderInputs();
  renderPreview();
};

// Calculate totals
function calculateTotals() {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const taxRate = parseFloat(taxRateInput.value) || 0;
  const discountRate = parseFloat(discountRateInput.value) || 0;

  const discountAmount = subtotal * (discountRate / 100);
  const taxableSubtotal = subtotal - discountAmount;
  const taxAmount = taxableSubtotal * (taxRate / 100);
  const grandTotal = taxableSubtotal + taxAmount;

  return { subtotal, discountAmount, taxAmount, grandTotal };
}

// Render invoice print preview
function renderPreview() {
  const totals = calculateTotals();

  previewContainer.innerHTML = `
    <div>
      <div class="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">${companyNameInput.value || 'Company Name'}</h1>
          <p class="text-xs text-slate-500 mt-1">Field Service & Operations</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 rounded uppercase tracking-wider mb-2">Invoice</span>
          <p class="text-xs text-slate-500"><strong>#</strong> ${invoiceNumberInput.value}</p>
          <p class="text-xs text-slate-500"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div class="mb-6">
        <p class="text-xs uppercase font-bold text-slate-400 tracking-wider">Billed To</p>
        <p class="text-base font-semibold text-slate-800">${clientNameInput.value || 'Client Name'}</p>
      </div>

      <table class="w-full text-left text-xs mb-6">
        <thead>
          <tr class="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider">
            <th class="py-2">Description</th>
            <th class="py-2 text-center w-16">Qty</th>
            <th class="py-2 text-right w-24">Rate</th>
            <th class="py-2 text-right w-24">Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${lineItems.map(item => `
            <tr>
              <td class="py-2.5 font-medium text-slate-800">${item.description || 'Item description'}</td>
              <td class="py-2.5 text-center text-slate-600">${item.qty}</td>
              <td class="py-2.5 text-right text-slate-600">$${item.rate.toFixed(2)}</td>
              <td class="py-2.5 text-right font-semibold text-slate-800">$${(item.qty * item.rate).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div>
      <div class="flex justify-end border-t border-slate-200 pt-4 mb-6">
        <div class="w-56 space-y-1 text-xs text-slate-600">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>$${totals.subtotal.toFixed(2)}</span>
          </div>
          ${totals.discountAmount > 0 ? `
          <div class="flex justify-between text-red-600">
            <span>Discount (${discountRateInput.value}%):</span>
            <span>-$${totals.discountAmount.toFixed(2)}</span>
          </div>` : ''}
          <div class="flex justify-between">
            <span>Tax (${taxRateInput.value}%):</span>
            <span>$${totals.taxAmount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total:</span>
            <span class="text-emerald-600">$${totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-4 text-xs text-slate-500">
        <p class="font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
        <p>${invoiceNotesInput.value}</p>
      </div>
    </div>
  `;
}

// Export preview div directly to PDF
function exportPDF() {
  const element = document.getElementById('invoicePreview');
  const opt = {
    margin:       0.5,
    filename:     `${invoiceNumberInput.value || 'invoice'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
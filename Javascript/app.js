document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. State & DOM Selections
  // ==========================================
  const logoInput = document.getElementById('logoInput');
  const companyName = document.getElementById('companyName');
  const clientName = document.getElementById('clientName');
  const invoiceNumber = document.getElementById('invoiceNumber');
  const taxRate = document.getElementById('taxRate');
  const discountRate = document.getElementById('discountRate');
  const invoiceNotes = document.getElementById('invoiceNotes');
  
  const itemsContainer = document.getElementById('itemsContainer');
  const invoicePreview = document.getElementById('invoicePreview');
  const btnAddRow = document.getElementById('btnAddRow');
  
  const btnExportPdf = document.getElementById('btnExportPdf');
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnHistory = document.getElementById('btnHistory');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const historyModal = document.getElementById('historyModal');

  let logoBase64 = '';

  // Default starting item
  let lineItems = [
    { description: 'HVAC System Diagnostic Inspection', qty: 1, price: 85.00 }
  ];

  // ==========================================
  // 2. Line Item Management & Calculations
  // ==========================================
  function renderLineItems() {
    itemsContainer.innerHTML = '';
    
    lineItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 gap-2 items-center item-row';
      row.innerHTML = `
        <input type="text" value="${item.description}" placeholder="Item description" class="col-span-6 border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none" onchange="updateItem(${index}, 'description', this.value)">
        <input type="number" value="${item.qty}" min="1" step="1" class="col-span-2 border rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-emerald-500 focus:outline-none" onchange="updateItem(${index}, 'qty', this.value)">
        <input type="number" value="${item.price}" min="0" step="0.01" class="col-span-3 border rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none" onchange="updateItem(${index}, 'price', this.value)">
        <button type="button" onclick="removeItem(${index})" class="col-span-1 text-slate-400 hover:text-red-500 font-bold text-center text-sm">&times;</button>
      `;
      itemsContainer.appendChild(row);
    });

    renderPreview();
  }

  window.updateItem = (index, key, value) => {
    if (key === 'qty' || key === 'price') {
      lineItems[index][key] = parseFloat(value) || 0;
    } else {
      lineItems[index][key] = value;
    }
    renderPreview();
  };

  window.removeItem = (index) => {
    lineItems.splice(index, 1);
    renderLineItems();
  };

  window.addPreset = (description, qty, price) => {
    lineItems.push({ description, qty, price });
    renderLineItems();
  };

  if (btnAddRow) {
    btnAddRow.addEventListener('click', () => {
      lineItems.push({ description: '', qty: 1, price: 0.00 });
      renderLineItems();
    });
  }

  // ==========================================
  // 3. Logo Upload Handling
  // ==========================================
  if (logoInput) {
    logoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          logoBase64 = event.target.result;
          renderPreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ==========================================
  // 4. Live Invoice Preview Renderer
  // ==========================================
  function renderPreview() {
    if (!invoicePreview) return;

    const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const taxVal = parseFloat(taxRate?.value || 0) / 100;
    const discVal = parseFloat(discountRate?.value || 0) / 100;
    
    const discountTotal = subtotal * discVal;
    const taxableSubtotal = subtotal - discountTotal;
    const taxTotal = taxableSubtotal * taxVal;
    const grandTotal = taxableSubtotal + taxTotal;

    const rowsHtml = lineItems.map(item => `
      <tr class="border-b border-slate-100 text-xs">
        <td class="py-2 text-slate-800">${item.description || '—'}</td>
        <td class="py-2 text-center text-slate-600">${item.qty}</td>
        <td class="py-2 text-right text-slate-600">$${item.price.toFixed(2)}</td>
        <td class="py-2 text-right text-slate-800 font-semibold">$${(item.qty * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    invoicePreview.innerHTML = `
      <div id="invoiceContent" class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-start border-b pb-4 border-slate-200">
          <div>
            ${logoBase64 ? `<img src="${logoBase64}" id="previewLogo" class="mb-2" alt="Logo">` : ''}
            <h1 class="text-xl font-black tracking-tight text-slate-900">${companyName?.value || 'Company Name'}</h1>
            <p class="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Field Service Estimate / Invoice</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded uppercase tracking-wider mb-1">Invoice</span>
            <div class="text-xs text-slate-500"><strong class="text-slate-700">#</strong> ${invoiceNumber?.value || 'INV-001'}</div>
            <div class="text-xs text-slate-500"><strong class="text-slate-700">Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <!-- Billed To -->
        <div class="bg-slate-50 p-3 rounded border border-slate-100 text-xs">
          <div class="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Billed To</div>
          <div class="font-bold text-slate-800 text-sm">${clientName?.value || 'Client Name'}</div>
        </div>

        <!-- Items Table -->
        <div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th class="py-2">Description</th>
                <th class="py-2 text-center">Qty</th>
                <th class="py-2 text-right">Price</th>
                <th class="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.length > 0 ? rowsHtml : '<tr><td colspan="4" class="empty-table-msg">No items added yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Totals & Notes -->
        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div class="text-xs text-slate-500">
            <div class="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">Notes & Terms</div>
            <p class="whitespace-pre-line text-slate-600">${invoiceNotes?.value || 'None'}</p>
          </div>
          <div class="space-y-1.5 text-xs text-right">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span class="font-semibold">$${subtotal.toFixed(2)}</span>
            </div>
            ${discountTotal > 0 ? `
            <div class="flex justify-between text-slate-600">
              <span>Discount (${discountRate.value}%):</span>
              <span class="font-semibold">-$${discountTotal.toFixed(2)}</span>
            </div>` : ''}
            <div class="flex justify-between text-slate-600">
              <span>Tax (${taxRate?.value || 0}%):</span>
              <span class="font-semibold">$${taxTotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-slate-900 text-base font-bold pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span id="totalAmount" class="text-emerald-600">$${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Real-time Event Listeners for inputs
  [companyName, clientName, invoiceNumber, taxRate, discountRate, invoiceNotes].forEach(input => {
    if (input) {
      input.addEventListener('input', renderPreview);
    }
  });

  // ==========================================
  // 5. PDF Export via html2pdf.js
  // ==========================================
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      const element = document.getElementById('invoicePreview');
      const filename = `${invoiceNumber?.value || 'Invoice'}_${clientName?.value || 'Client'}.pdf`;

      const opt = {
        margin:       0.4,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    });
  }

  // ==========================================
  // 6. Save Profile & LocalStorage Handlers
  // ==========================================
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', saveInvoiceToLocalStorage);
  }

  function saveInvoiceToLocalStorage() {
    const totalEl = document.getElementById('totalAmount');
    const invoiceData = {
      id: invoiceNumber?.value || 'INV-001',
      clientName: clientName?.value || 'John Doe',
      date: new Date().toLocaleDateString(),
      amount: totalEl ? totalEl.innerText : '$0.00',
    };

    let history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
    const existingIndex = history.findIndex(inv => inv.id === invoiceData.id);
    
    if (existingIndex > -1) {
      history[existingIndex] = invoiceData;
    } else {
      history.push(invoiceData);
    }

    localStorage.setItem('tradebill_invoices', JSON.stringify(history));
    alert('Invoice saved to history!');
  }

  // ==========================================
  // 7. History Modal Handlers
  // ==========================================
  if (btnHistory) {
    btnHistory.addEventListener('click', () => {
      if (historyModal) {
        historyModal.classList.remove('hidden');
        renderHistoryList();
      }
    });
  }

  if (btnCloseHistory) {
    btnCloseHistory.addEventListener('click', () => {
      if (historyModal) {
        historyModal.classList.add('hidden');
      }
    });
  }

  function renderHistoryList() {
    const historyListContainer = document.getElementById('historyList');
    if (!historyListContainer) return;

    const history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
    historyListContainer.innerHTML = '';

    if (history.length === 0) {
      historyListContainer.innerHTML = '<p class="text-slate-500">No saved invoices found.</p>';
      return;
    }

    history.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center';
      card.innerHTML = `
        <div>
          <div class="font-bold text-slate-800">${item.id} — ${item.clientName}</div>
          <div class="text-slate-500 text-xs">${item.date} • ${item.amount}</div>
        </div>
        <div class="flex space-x-2">
          <button class="px-2 py-1 bg-slate-200 text-slate-600 rounded font-semibold text-xs hover:bg-slate-300" onclick="deleteInvoice('${item.id}')">✕</button>
        </div>
      `;
      historyListContainer.appendChild(card);
    });
  }

  // Initial Run
  renderLineItems();
});

// Helper for history deletion
window.deleteInvoice = function(id) {
  let history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
  history = history.filter(inv => inv.id !== id);
  localStorage.setItem('tradebill_invoices', JSON.stringify(history));
  location.reload();
};
document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. DOM Element Selections (MATCHED TO HTML)
  // ==========================================
  const btnExportPdf = document.getElementById('btnExportPdf');
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnHistory = document.getElementById('btnHistory');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const historyModal = document.getElementById('historyModal');

  // ==========================================
  // 2. Export / Print PDF Handler
  // ==========================================
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      // Triggers browser native print dialog
      window.print();
    });
  }

  // ==========================================
  // 3. Save / LocalStorage Handlers
  // ==========================================
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      saveInvoiceToLocalStorage();
    });
  }

  function saveInvoiceToLocalStorage() {
    const invoiceData = {
      id: document.getElementById('invoiceNumber')?.value || '#INV-2026-001',
      clientName: document.getElementById('clientName')?.value || 'John Doe',
      date: new Date().toLocaleDateString(),
      amount: document.getElementById('totalAmount')?.innerText || '$248.45',
    };

    let history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
    
    const existingIndex = history.findIndex(inv => inv.id === invoiceData.id);
    if (existingIndex > -1) {
      history[existingIndex] = invoiceData;
    } else {
      history.push(invoiceData);
    }

    localStorage.setItem('tradebill_invoices', JSON.stringify(history));
    alert('Invoice saved successfully!');
  }

  // ==========================================
  // 4. Modal / Drawer Toggle Handlers
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
          <button class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-semibold text-xs border border-emerald-200 hover:bg-emerald-100" onclick="loadInvoice('${item.id}')">Load</button>
          <button class="px-2 py-1 bg-slate-200 text-slate-600 rounded font-semibold text-xs hover:bg-slate-300" onclick="deleteInvoice('${item.id}')">✕</button>
        </div>
      `;
      historyListContainer.appendChild(card);
    });
  }
});

// Helper global handlers for inline click events
window.loadInvoice = function(id) {
  const history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
  const selected = history.find(inv => inv.id === id);
  if (selected) {
    console.log('Loading invoice:', selected);
  }
};

window.deleteInvoice = function(id) {
  let history = JSON.parse(localStorage.getItem('tradebill_invoices')) || [];
  history = history.filter(inv => inv.id !== id);
  localStorage.setItem('tradebill_invoices', JSON.stringify(history));
  
  const historyListContainer = document.getElementById('historyList');
  if (historyListContainer) {
    location.reload();
  }
};
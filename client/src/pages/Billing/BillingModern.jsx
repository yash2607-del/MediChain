import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaSearch, FaCamera, FaTrash, FaPlus, FaMinus, FaFileInvoice, FaPrint, FaDownload } from 'react-icons/fa';
import { downloadBillPDF, printBillPDF } from '../../utils/pdfGenerator.js';

export default function BillingModern({ inventory = [], updateStock = () => {}, pharmacyInfo = {} }) {
  const [query, setQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [billItems, setBillItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', doctor: '' });
  const [billNo, setBillNo] = useState(() => `INV-${Date.now().toString().slice(-6)}`);
  const [payment, setPayment] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const TAX_RATE = 0.12;
  const inputRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return inventory
      .filter(m =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.drugCode && m.drugCode.toLowerCase().includes(q)) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, inventory]);

  const totals = useMemo(() => {
    const subtotal = billItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const grand = Math.max(0, subtotal + tax - (Number(discount) || 0));
    return { subtotal, tax, grand };
  }, [billItems, discount]);

  const inventoryByCode = useMemo(() => {
    const map = new Map();
    for (const m of inventory) map.set(m.drugCode, m);
    return map;
  }, [inventory]);

  function addItem(med) {
    if (!med) return;
    setBillItems(prev => {
      const idx = prev.findIndex(p => p.drugCode === med.drugCode);
      if (idx >= 0) {
        const current = prev[idx];
        const available = inventoryByCode.get(med.drugCode)?.quantity ?? 0;
        const newQty = Math.min(current.qty + 1, available || 1);
        const updated = [...prev];
        updated[idx] = { ...current, qty: newQty };
        return updated;
      }
      return [...prev, { drugCode: med.drugCode, name: med.name, price: med.price || 0, qty: 1 }];
    });
    setIdInput('');
    setQuery('');
    setSuggestOpen(false);
    inputRef.current?.focus();
  }

  function addById() {
    const code = (idInput || '').trim();
    if (!code) return;
    const med = inventory.find(m => (m.drugCode || '').toString().toLowerCase() === code.toLowerCase());
    if (!med) return alert('Medicine ID not found in inventory.');
    if (!med.quantity) return alert('Selected medicine is out of stock.');
    addItem(med);
  }

  function setQty(drugCode, qty) {
    setBillItems(prev => {
      const n = Math.max(1, Math.floor(Number(qty) || 0));
      const available = inventoryByCode.get(drugCode)?.quantity ?? Infinity;
      return prev.map(p => (p.drugCode === drugCode ? { ...p, qty: Math.min(n, available) } : p));
    });
  }

  function inc(drugCode, delta) {
    setBillItems(prev => {
      return prev.map(p => {
        if (p.drugCode !== drugCode) return p;
        const available = inventoryByCode.get(drugCode)?.quantity ?? Infinity;
        const next = Math.max(1, Math.min(p.qty + delta, available));
        return { ...p, qty: next };
      });
    });
  }

  function removeItem(drugCode) {
    setBillItems(prev => prev.filter(p => p.drugCode !== drugCode));
  }

  function clearBill() {
    setBillItems([]);
    setDiscount(0);
    setBillNo(`INV-${Date.now().toString().slice(-6)}`);
    setCustomer({ name: '', phone: '', doctor: '' });
  }

  async function completeSale() {
    if (billItems.length === 0) return alert('No items in bill.');
    
    const session = (() => { try { return JSON.parse(localStorage.getItem('session') || 'null') } catch { return null } })();
    const pharmacyId = session?.user?.id || session?.user?._id;
    if (!pharmacyId) return alert('Missing pharmacyId. Please login again.');

    setSubmitting(true);
    const items = billItems.map(it => ({
      drugCode: it.drugCode,
      name: it.name,
      qty: it.qty,
      price: it.price,
      subtotal: it.price * it.qty,
    }));

    const payload = { 
      pharmacyId, 
      items, 
      total: totals.grand,
      customer,
      payment,
      discount: Number(discount) || 0
    };

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Billing failed');
      
      // Update local inventory
      billItems.forEach(it => updateStock(it.drugCode, it.qty));
      
      // Generate PDF
      const billData = {
        ...data,
        billNo,
        customer,
        payment,
        items,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: Number(discount) || 0,
        total: totals.grand
      };
      
      // Auto-download PDF
      downloadBillPDF(billData, pharmacyInfo, `invoice-${billNo}.pdf`);
      
      alert(`✅ Bill Generated Successfully!\n\nInvoice: ${billNo}\nTotal: ₹${totals.grand}\n\nPDF downloaded automatically.`);
      clearBill();
    } catch (e) {
      alert('❌ ' + (e.message || 'Failed to complete sale'));
    } finally {
      setSubmitting(false);
    }
  }

  function generatePDF() {
    if (billItems.length === 0) return alert('No items in bill to generate PDF.');
    
    const billData = {
      billNo,
      customer,
      payment,
      items: billItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: Number(discount) || 0,
      total: totals.grand
    };
    
    downloadBillPDF(billData, pharmacyInfo, `invoice-${billNo}.pdf`);
  }

  function printPDF() {
    if (billItems.length === 0) return alert('No items in bill to print.');
    
    const billData = {
      billNo,
      customer,
      payment,
      items: billItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: Number(discount) || 0,
      total: totals.grand
    };
    
    printBillPDF(billData, pharmacyInfo);
  }

  const onKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestOpen(true);
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightIdx]) {
        addItem(suggestions[highlightIdx]);
      }
    }
  };

  async function startScanner() {
    if (typeof window === 'undefined') return alert('Camera scanner unavailable');
    try {
      if (html5QrcodeRef.current) {
        try { await html5QrcodeRef.current.stop(); } catch (_) {}
        try { html5QrcodeRef.current.clear(); } catch (_) {}
        html5QrcodeRef.current = null;
      }

      html5QrcodeRef.current = new Html5Qrcode('billing-qr-scanner');
      setScanning(true);
      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 200 },
        (decodedText) => onScan(decodedText)
      );
    } catch (e) {
      console.error('startScanner error', e);
      setScanning(false);
      alert('Failed to start camera: ' + (e?.message || e));
    }
  }

  async function stopScanner() {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        try { html5QrcodeRef.current.clear(); } catch (_) {}
        html5QrcodeRef.current = null;
      }
    } catch (e) {
      console.warn('stopScanner error', e);
    } finally {
      setScanning(false);
    }
  }

  function onScan(decodedText) {
    let code = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.drugCode) code = parsed.drugCode;
    } catch {}
    const med = inventory.find(m => (m.drugCode || '').toString().toLowerCase() === String(code).toLowerCase());
    if (!med) {
      alert('Scanned code not found in inventory');
      return;
    }
    if (!med.quantity) {
      alert('Scanned medicine is out of stock');
      return;
    }
    addItem(med);
    stopScanner();
  }

  useEffect(() => {
    return () => { if (scanning) stopScanner(); };
  }, [scanning]);

  return (
    <div className="billing-modern">
      {/* Customer Info */}
      <div className="customer-info-grid">
        <div className="input-group">
          <label>Customer Name</label>
          <input 
            placeholder="Enter customer name" 
            value={customer.name} 
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })} 
          />
        </div>
        <div className="input-group">
          <label>Phone Number</label>
          <input 
            placeholder="Enter phone number" 
            value={customer.phone} 
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} 
          />
        </div>
        <div className="input-group">
          <label>Prescribing Doctor</label>
          <input 
            placeholder="Doctor name (optional)" 
            value={customer.doctor} 
            onChange={(e) => setCustomer({ ...customer, doctor: e.target.value })} 
          />
        </div>
        <div className="input-group">
          <label>Invoice Number</label>
          <input value={billNo} onChange={(e) => setBillNo(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Payment Method</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
            <option>Insurance</option>
          </select>
        </div>
        <div className="input-group">
          <label>Date & Time</label>
          <input value={new Date().toLocaleString()} readOnly style={{ background: '#f8fafc' }} />
        </div>
      </div>

      {/* Search Medicine */}
      <div className="search-medicine-container">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search medicine by name, code, or manufacturer..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSuggestOpen(true); setHighlightIdx(0); }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
          onFocus={() => query && setSuggestOpen(true)}
        />
        {suggestOpen && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((s, i) => {
              const disabled = !s.quantity;
              return (
                <div
                  key={s.drugCode}
                  className={`suggestion-item ${i === highlightIdx ? 'highlighted' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { if (!disabled) addItem(s); }}
                  style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                  <div className="item-name">{s.name}</div>
                  <div className="item-details">
                    <span>Code: {s.drugCode}</span>
                    <span>₹{s.price}</span>
                    <span style={{ color: disabled ? '#dc2626' : '#16a34a' }}>
                      Stock: {s.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className="quick-add-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Enter Medicine ID"
          style={{ 
            flex: 1,
            minWidth: '200px',
            padding: '0.75rem 1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '0.75rem'
          }}
          onKeyDown={(e) => e.key === 'Enter' && addById()}
        />
        <button 
          onClick={addById}
          className="btn-blue"
        >
          <FaPlus /> Add by ID
        </button>
        {!scanning && (
          <button 
            onClick={startScanner}
            className="btn-blue-outline"
          >
            <FaCamera /> Scan QR
          </button>
        )}
        {scanning && (
          <button 
            onClick={stopScanner}
            className="btn-blue"
            style={{ background: '#dc2626' }}
          >
            Stop Scan
          </button>
        )}
      </div>

      {scanning && (
        <div className="qr-scanner-container">
          <div id="billing-qr-scanner" />
        </div>
      )}

      {/* Bill Items Table */}
      <table className="bill-table">
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Code</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Stock</th>
            <th>Subtotal</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {billItems.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No items added yet. Search and add medicines above.
              </td>
            </tr>
          )}
          {billItems.map(it => {
            const available = inventoryByCode.get(it.drugCode)?.quantity ?? 0;
            const subtotal = it.price * it.qty;
            const exceeded = it.qty > available;
            return (
              <tr key={it.drugCode}>
                <td className="item-name">{it.name}</td>
                <td style={{ fontFamily: 'Courier New, monospace', fontSize: '0.85rem' }}>{it.drugCode}</td>
                <td>₹{it.price.toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => inc(it.drugCode, -1)} 
                      disabled={it.qty <= 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaMinus size={10} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => setQty(it.drugCode, e.target.value)}
                      style={{
                        width: '70px',
                        padding: '0.5rem',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <button 
                      onClick={() => inc(it.drugCode, +1)} 
                      disabled={it.qty >= available}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                  {exceeded && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Only {available} available
                    </div>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: available > 10 ? '#dcfce7' : available > 0 ? '#fef3c7' : '#fee2e2',
                    color: available > 10 ? '#16a34a' : available > 0 ? '#d97706' : '#dc2626'
                  }}>
                    {available}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => removeItem(it.drugCode)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaTrash /> Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals-panel">
        <div className="totals-row">
          <span>Subtotal</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="totals-row">
          <span>Tax (12% GST)</span>
          <span>₹{totals.tax.toFixed(2)}</span>
        </div>
        <div className="totals-row">
          <span>Discount</span>
          <input 
            type="number" 
            min={0} 
            value={discount} 
            onChange={(e) => setDiscount(e.target.value)}
            style={{
              width: '100px',
              padding: '0.5rem',
              border: '2px solid white',
              borderRadius: '0.5rem',
              textAlign: 'right',
              fontWeight: 700
            }}
          />
        </div>
        <div className="totals-row grand-total">
          <span>GRAND TOTAL</span>
          <span>₹{totals.grand.toFixed(2)}</span>
        </div>

        <div className="action-buttons">
          <button 
            className="btn-primary" 
            onClick={completeSale} 
            disabled={billItems.length === 0 || submitting}
          >
            <FaFileInvoice /> {submitting ? 'Processing...' : 'Complete & Download PDF'}
          </button>
          <button className="btn-secondary" onClick={printPDF} disabled={billItems.length === 0}>
            <FaPrint /> Print
          </button>
          <button className="btn-secondary" onClick={generatePDF} disabled={billItems.length === 0}>
            <FaDownload /> PDF
          </button>
          <button className="btn-secondary" onClick={clearBill}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { FaCashRegister, FaBoxes, FaHistory, FaShieldAlt, FaChartLine, FaPlus } from 'react-icons/fa';
import DashboardLayout from './DashboardLayout.jsx';
import BillingModern from '../pages/Billing/BillingModern.jsx';
import AddMedicineForm from '../pages/Inventory/AddMedicineForm.jsx';
import InventoryModern from '../pages/Inventory/InventoryModern.jsx';
import PatientHistory from '../pages/Pharmacy/PatientHistory.jsx';
import PharmacyVerificationForm from './pharmacy/PharmacyVerificationForm.jsx';
import '../styles/pharmacy-dashboard.scss';

export default function PharmacyDashboard() {
  const [active, setActive] = useState('overview');
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0 });
  const [loading, setLoading] = useState(true);

  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem('session') || 'null');
    } catch {
      return null;
    }
  })();

  const pharmacyId = session?.user?.id || session?.user?._id;
  const pharmacyInfo = {
    name: session?.user?.profile?.shopName || session?.user?.profile?.name || 'MediChain Pharmacy',
    address: session?.user?.profile?.address || '',
    phone: session?.user?.profile?.phone || '',
    email: session?.user?.email || '',
  };

  useEffect(() => {
    if (!pharmacyId) return;
    setLoading(true);
    fetch(`/api/inventory?pharmacyId=${encodeURIComponent(pharmacyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInventory(data);
      })
      .catch((err) => console.error('Failed to load inventory:', err))
      .finally(() => setLoading(false));
  }, [pharmacyId]);

  useEffect(() => {
    if (!pharmacyId) return;
    fetch(`/api/billing?pharmacyId=${encodeURIComponent(pharmacyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setBills(data);
        const revenue = data.reduce((sum, bill) => sum + (bill.total || 0), 0);
        const uniqueCustomers = new Set(data.map((b) => b.customer?.phone).filter(Boolean)).size;
        setStats({
          revenue,
          orders: data.length,
          products: inventory.length,
          customers: uniqueCustomers || data.length,
        });
      })
      .catch((err) => console.error('Failed to load bills:', err));
  }, [pharmacyId, inventory.length]);

  const addMedicine = useCallback((med) => {
    setInventory((prev) => {
      const existingIdx = prev.findIndex((m) => m.drugCode === med.drugCode);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 0) + (med.quantity || 0),
        };
        return updated;
      }
      return [...prev, med];
    });
  }, []);

  const updateStock = useCallback((drugCode, soldQty) => {
    setInventory((prev) =>
      prev.map((m) =>
        m.drugCode === drugCode
          ? { ...m, quantity: Math.max(0, (m.quantity || 0) - (soldQty || 0)) }
          : m,
      ),
    );
  }, []);

  const menuItems = [
    { key: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { key: 'billing', label: 'Billing', icon: <FaCashRegister /> },
    { key: 'inventory', label: 'Inventory', icon: <FaBoxes /> },
    { key: 'add-medicine', label: 'Add Medicine', icon: <FaPlus /> },
    { key: 'history', label: 'Patient History', icon: <FaHistory /> },
    { key: 'verification', label: 'Verification', icon: <FaShieldAlt /> },
  ];

  return (
    <div className="pharmacy-dashboard">
      <DashboardLayout brand="MediChain Pharmacy" menuItems={menuItems} active={active} setActive={setActive}>
        {loading && (
          <div className="pharmacy-section">
            <div style={{ padding: '1rem', color: '#64748b' }}>Loading…</div>
          </div>
        )}

        {!loading && active === 'overview' && (
          <div className="dashboard-content fade-in">
            <div className="pharmacy-stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon revenue">
                    <FaCashRegister />
                  </div>
                  <div className="stat-trend up">+12.5%</div>
                </div>
                <div className="stat-value">₹{stats.revenue.toLocaleString()}</div>
                <div className="stat-label">Total Revenue</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon orders">
                    <FaHistory />
                  </div>
                  <div className="stat-trend up">+8.2%</div>
                </div>
                <div className="stat-value">{stats.orders}</div>
                <div className="stat-label">Total Orders</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon products">
                    <FaBoxes />
                  </div>
                  <div className="stat-trend up">+3</div>
                </div>
                <div className="stat-value">{stats.products}</div>
                <div className="stat-label">Products in Stock</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon customers">
                    <FaHistory />
                  </div>
                  <div className="stat-trend up">+15</div>
                </div>
                <div className="stat-value">{stats.customers}</div>
                <div className="stat-label">Customers</div>
              </div>
            </div>

            <div className="pharmacy-section">
              <div className="section-header">
                <h2>
                  <FaBoxes className="icon" /> Quick Inventory Overview
                </h2>
              </div>
              <InventoryModern inventory={inventory.slice(0, 6)} addMedicine={addMedicine} compact />
              {inventory.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => setActive('inventory')}
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View All {inventory.length} Items
                  </button>
                </div>
              )}
            </div>

            <div className="pharmacy-section">
              <div className="section-header">
                <h2><FaHistory className="icon" /> Recent Bills</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Bill No</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Items</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.slice(0, 5).map(bill => (
                      <tr key={bill._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>{bill._id?.slice(-8) || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem' }}>{bill.items?.length || 0} items</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                          ₹{bill.total?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          No bills yet. Create your first bill!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === 'billing' && (
          <div className="pharmacy-section fade-in">
            <div className="section-header">
              <h2><FaCashRegister className="icon" /> Billing & Checkout</h2>
            </div>
            <BillingModern 
              inventory={inventory} 
              updateStock={updateStock}
              pharmacyInfo={pharmacyInfo}
            />
          </div>
        )}

        {active === 'inventory' && (
          <div className="pharmacy-section fade-in">
            <div className="section-header">
              <h2><FaBoxes className="icon" /> Inventory Management</h2>
            </div>
            <InventoryModern inventory={inventory} addMedicine={addMedicine} />
          </div>
        )}

        {active === 'add-medicine' && (
          <div className="pharmacy-section fade-in">
            <div className="section-header">
              <h2><FaPlus className="icon" /> Add Medicine to Inventory</h2>
            </div>
            <AddMedicineForm addMedicine={addMedicine} pharmacyId={pharmacyId} />
          </div>
        )}

        {active === 'history' && (
          <div className="pharmacy-section fade-in">
            <div className="section-header">
              <h2><FaHistory className="icon" /> Patient History</h2>
            </div>
            <PatientHistory />
          </div>
        )}

        {active === 'verification' && (
          <div className="pharmacy-section fade-in">
            <div className="section-header">
              <h2><FaShieldAlt className="icon" /> Pharmacy Verification</h2>
            </div>
            <PharmacyVerificationForm />
          </div>
        )}
      </DashboardLayout>
    </div>
  );
}

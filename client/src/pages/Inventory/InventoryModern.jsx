import React, { useEffect, useState } from 'react';
import { FaSearch, FaBoxOpen, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function InventoryModern({ inventory = [], addMedicine, compact = false }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(inventory);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    setItems(inventory);
  }, [inventory]);

  const q = (s = '') => String(s || '').toLowerCase();
  const filtered = items.filter(it => {
    if (!query) return true;
    const term = q(query);
    return (
      q(it.name).includes(term) ||
      q(it.drugCode).includes(term) ||
      q(it.batch).includes(term) ||
      q(it.manufacturer).includes(term) ||
      q(it.expiry).includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'quantity') return (b.quantity || 0) - (a.quantity || 0);
    if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const displayed = compact ? sorted.slice(0, 6) : sorted;

  const getStockStatus = (qty) => {
    if (qty === 0) return 'out-of-stock';
    if (qty < 10) return 'low-stock';
    return 'in-stock';
  };

  const getStockLabel = (qty) => {
    if (qty === 0) return 'Out of Stock';
    if (qty < 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStockIcon = (qty) => {
    if (qty === 0) return <FaExclamationTriangle />;
    if (qty < 10) return <FaExclamationTriangle />;
    return <FaCheckCircle />;
  };

  return (
    <div className="inventory-modern">
      {!compact && (
        <div className="inventory-header">
          <div className="search-filters">
            <input
              placeholder="Search inventory..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading inventory...
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          color: '#64748b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <FaBoxOpen size={64} style={{ opacity: 0.3 }} />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No items found
            </div>
            <div>
              {query ? 'Try adjusting your search' : 'Add medicines to your inventory to get started'}
            </div>
          </div>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="inventory-grid">
          {displayed.map((it, idx) => {
            const stockStatus = getStockStatus(it.quantity || 0);
            const stockLabel = getStockLabel(it.quantity || 0);
            const stockIcon = getStockIcon(it.quantity || 0);

            return (
              <div key={idx} className="inventory-card fade-in">
                <div className="card-header">
                  <div className="medicine-name">{it.name}</div>
                  <div className="drug-code">{it.drugCode}</div>
                </div>

                <div className="card-details">
                  {it.manufacturer && (
                    <div className="detail-row">
                      <span className="label">Manufacturer:</span>
                      <span>{it.manufacturer}</span>
                    </div>
                  )}
                  {it.batch && (
                    <div className="detail-row">
                      <span className="label">Batch:</span>
                      <span>{it.batch}</span>
                    </div>
                  )}
                  {it.expiry && (
                    <div className="detail-row">
                      <span className="label">Expiry:</span>
                      <span>{it.expiry}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span style={{ fontWeight: 700, color: '#667eea' }}>₹{it.price || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span style={{ fontWeight: 700 }}>{it.quantity || 0} units</span>
                  </div>
                </div>

                <div className={`stock-badge ${stockStatus}`}>
                  {stockIcon} {stockLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

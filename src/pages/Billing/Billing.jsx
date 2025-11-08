import React, { useState } from "react";

export default function Billing({ inventory, updateStock }) {
  const [billItems, setBillItems] = useState([]);
  const [total, setTotal] = useState(0);

  const addItem = (item) => {
    const qty = prompt(`Enter quantity for ${item.name} (Available: ${item.quantity})`);
    const num = Number(qty);
    if (!num || num > item.quantity) return alert("Invalid quantity!");
    const subtotal = num * item.price;
    setBillItems([...billItems, { ...item, qty: num, subtotal }]);
    setTotal(total + subtotal);
  };

  const generateBill = () => {
    alert(`Bill Generated!\nTotal: ₹${total}`);
    billItems.forEach((it) => updateStock(it.drugCode, it.qty));
    setBillItems([]);
    setTotal(0);
  };

  return (
    <div>
      <h3>🧾 Billing</h3>
      <h4>Inventory</h4>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Batch</th>
            <th>Expiry</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Sell</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td>{item.batch}</td>
              <td>{item.expiry}</td>
              <td>{item.quantity}</td>
              <td>₹{item.price}</td>
              <td><button onClick={() => addItem(item)}>Add to Bill</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>🧮 Bill Summary</h4>
      {billItems.length > 0 ? (
        <>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{it.qty}</td>
                  <td>₹{it.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Total: ₹{total}</h3>
          <button onClick={generateBill}>Generate Bill</button>
        </>
      ) : (
        <p>No items selected yet.</p>
      )}
    </div>
  );
}

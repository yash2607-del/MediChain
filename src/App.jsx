import React, { useState } from "react";
import ScanAddStock from "../src/pages/Scan/ScanAddStock.jsx";
import Billing from "../src/pages/Billing/Billing.jsx";

export default function App() {
  const [inventory, setInventory] = useState([]);
  const pharmacyId = "P001";

  // add new medicine or update quantity
  const addMedicine = (newMed) => {
    setInventory((prev) => {
      const existing = prev.find((m) => m.drugCode === newMed.drugCode);
      if (existing) {
        return prev.map((m) =>
          m.drugCode === newMed.drugCode
            ? { ...m, quantity: m.quantity + newMed.quantity }
            : m
        );
      } else {
        return [...prev, newMed];
      }
    });
  };

  // reduce quantity after billing
  const updateStock = (drugCode, qtySold) => {
    setInventory((prev) =>
      prev.map((m) =>
        m.drugCode === drugCode ? { ...m, quantity: m.quantity - qtySold } : m
      )
    );
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🏥 Rural HealthNet - Pharmacy Portal</h1>
      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <ScanAddStock pharmacyId={pharmacyId} addMedicine={addMedicine} />
        </div>
        <div style={{ flex: 1 }}>
          <Billing
            pharmacyId={pharmacyId}
            inventory={inventory}
            updateStock={updateStock}
          />
        </div>
      </div>
    </div>
  );
}

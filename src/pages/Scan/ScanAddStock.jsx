import React, { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const scannerId = "html5qr-scanner";

export default function ScanAddStock({ addMedicine, pharmacyId }) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [quantity, setQuantity] = useState("");
  const html5QrcodeRef = useRef(null);

  const startScanner = async () => {
    setScanning(true);
    html5QrcodeRef.current = new Html5Qrcode(scannerId);
    await html5QrcodeRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 200 },
      (decodedText) => {
        stopScanner();
        try {
          const parsed = JSON.parse(decodedText);
          setScannedData(parsed);
        } catch {
          setScannedData({
            drugCode: decodedText,
            name: "Paracetamol 500mg",
            batch: "BCH123",
            expiry: "2026-08-10",
            manufacturer: "Sun Pharma",
          });
        }
      }
    );
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      await html5QrcodeRef.current.stop();
      html5QrcodeRef.current.clear();
      html5QrcodeRef.current = null;
      setScanning(false);
    }
  };

  const addToInventory = () => {
    if (!scannedData || !quantity) return alert("Enter quantity!");
    const newMed = {
      ...scannedData,
      quantity: Number(quantity),
      price: Math.floor(Math.random() * 50) + 10, // random price for demo
    };
    addMedicine(newMed);
    setScannedData(null);
    setQuantity("");
    alert("✅ Added to inventory");
  };

  return (
    <div>
      <h3>📷 Scan & Add Medicine</h3>
      {!scanning && <button onClick={startScanner}>Start Scanner</button>}
      {scanning && <button onClick={stopScanner}>Stop Scanner</button>}

      <div id={scannerId} style={{ width: "300px", height: "200px", marginTop: "1rem" }}></div>

      {scannedData && (
        <div style={{ marginTop: "1rem", background: "#f9f9f9", padding: "1rem" }}>
          <p><b>Name:</b> {scannedData.name}</p>
          <p><b>Batch:</b> {scannedData.batch}</p>
          <p><b>Expiry:</b> {scannedData.expiry}</p>
          <input
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button onClick={addToInventory}>Add</button>
        </div>
      )}
    </div>
  );
}

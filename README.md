# 🩺 MediChain — Blockchain-Enabled Healthcare Ecosystem

> A secure, AI-powered, and blockchain-backed web application connecting **patients**, **doctors**, and **pharmacies** through verified prescriptions, real-time inventory, and intelligent health guidance.

---

## 🚀 Overview

**MediChain** is a decentralized healthcare management platform that unifies patients, doctors, and pharmacies under one transparent and secure system. It leverages **blockchain** for tamper-proof prescription storage and **GenAI** for smart symptom classification and doctor recommendations.

The goal is to eliminate prescription fraud, simplify medicine discovery, and make healthcare data interoperable, verifiable, and patient-centric.

---

## 👥 Roles & Dashboards

### 🧑‍⚕️ Doctor

- Create digital prescriptions and store them immutably on the **blockchain**.
- Access patients’ medical history and past prescriptions.
- Ensure all prescriptions are verifiable and tamper-proof.

### 💊 Pharmacy

- **Scan QR codes** to verify prescriptions via blockchain before dispensing.
- Manage real-time **medicine inventory** using a QR-based system.
- Generate **bills** from inventory and sync with the shared pharmacy database.

### 🧍‍♂️ Patient

- View all verified prescriptions securely on their dashboard.
- **Search for medicines** and view pharmacies with availability on an **interactive map**.
- Interact with a **GenAI chatbot** to describe symptoms and receive doctor recommendations based on AI-classified specialization.

---

## 🔑 Core Features

| Feature | Description |
|---|---|
| **Blockchain-Powered Prescriptions** | Every prescription is hashed and stored on-chain for authenticity verification. |
| **Pharmacy Inventory Management** | Add, track, and scan medicine stock using QR codes. |
| **Medicine Locator Map** | Patients can search for medicines nearby via geolocation-enabled maps. |
| **AI Chatbot** | A generative AI chatbot helps patients classify symptoms and suggests the right doctor specialization. |
| **Role-Based Dashboards** | Secure authentication and different dashboards for each user type. |
| **Verified Transactions** | Pharmacies verify prescriptions through blockchain before dispensing. |

---

## 🌐 Blockchain Prescription Flow

1. Doctor creates a prescription → JSON object generated.
2. Prescription is hashed and uploaded to blockchain → transaction hash returned.
3. Hash stored in backend DB linked to doctor, patient, and pharmacy IDs.
4. Pharmacy scans prescription QR → hash verified on blockchain.
5. Patient dashboard fetches verified prescriptions from blockchain.

---

## 💬 AI Chatbot Flow

1. Patient interacts with chatbot and describes symptoms.
2. Generative AI model categorizes symptoms into medical specializations.
3. Returns a list of relevant doctors nearby, fetched from the database.

---

## 🗺️ Medicine Search & Map Integration

- Each pharmacy updates inventory with available medicines.
- Patients search for a medicine name.
- The app queries all pharmacy databases and filters by geolocation.
- Nearby pharmacies are displayed as map markers with directions.

---

## 🔮 Future Enhancements

- 📱 Mobile app (React Native / Flutter)
- 🧾 Integration with insurance providers for e-claim verification
- 🤖 AI-based prescription conflict detection
- 🗣️ Voice-based chatbot for accessibility
- 🏥 Integration with telemedicine APIs for online consultations

---

## 🛠️ License

This project is licensed under the MIT License.

---

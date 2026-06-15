# 🛡️ SafeRide: Your Safety, Automated.

> **🚨 EVALUATOR NOTE FOR LIVE DEMO 🚨**
> SafeRide is a native mobile application built with React Native and Expo, deployed to the web via Vercel for ease of access. 
> **To experience the intended UI:** Please open the live link on a desktop browser, press `F12` to open Developer Tools, and click the `Toggle Device Toolbar` icon (or press `Ctrl+Shift+M`) to view the application in mobile proportions.

### 🔗 Links
* **Live Demo:** [https://safe-ride-app.vercel.app](https://safe-ride-app.vercel.app)
* **Video Presentation:** [Insert Link Here (Optional)]

---

## 📌 The Problem
Women frequently face safety concerns during daily commutes in cabs or auto-rickshaws, lacking a reliable way to verify a vehicle's legitimacy before boarding. Existing applications typically require manual intervention or button presses during high-stress emergencies, which isn't always possible. 

## 💡 The Solution
SafeRide acts as a proactive, automated guardian. We shift the focus from reactive SOS buttons to preventative verification and automated tracking.

### Core Features:
* **Instant RTO Verification:** Passengers can instantly verify a vehicle's registration data and legitimacy before ever stepping inside.
* **Automated Live Tracking:** Once a trip begins, SafeRide automatically enforces live-GPS tracking, sending status updates and a tracking link via WhatsApp to pre-selected emergency contacts.
* **Community-Driven Safety:** A robust passenger rating and vehicle flagging system that warns future riders about potentially unsafe drivers or vehicles.
* **Seamless UI/UX:** A fully custom, dark-mode optimized interface built for speed and clarity during high-stress situations.

---

## 🛠️ Technology Stack
* **Frontend:** React Native, Expo, Expo Router
* **Backend & Database:** Firebase (Authentication & Firestore)
* **APIs & Integrations:** 
  * Twilio API (Automated WhatsApp/SMS alerts)
  * RapidAPI / RTO Database (Vehicle verification)
* **Deployment:** Vercel (Web build)

---

## 🚀 Running the Project Locally

If you would like to run the mobile application locally using the Expo Go app or an emulator, follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/passionate-coder26/SafeRide-app.git](https://github.com/passionate-coder26/SafeRide-app.git)
cd SafeRide-app

# 🛡️ SafeRide: Your Safety, Automated.

> **🚨 EVALUATOR NOTE FOR LIVE DEMO 🚨**
> SafeRide is a native mobile application built with React Native and Expo, deployed to the web via Vercel for ease of access. 
> **To experience the intended UI:** Please open the live link on a desktop browser, press `F12` to open Developer Tools, and click the `Toggle Device Toolbar` icon (or press `Ctrl+Shift+M`) to view the application in mobile proportions.
> **WhatsApp Tracking Alerts:** Since this is a prototype using the Twilio Sandbox, emergency contacts must send a one-time opt-in code to the Twilio number to receive messages. *In a production environment with a registered business account, this step is completely removed and alerts are sent automatically.
> > * **RTO API Limits:** Due to strict free-tier rate limits on real-time Indian RTO databases, the live prototype includes a seamless fallback system. If the third-party API quota is exceeded during evaluation, the app will automatically display high-fidelity simulated vehicle metrics, ensuring you can evaluate the complete user flow without interruption.

### 🔗 Links
* **Live Demo:** [https://safe-ride-app.vercel.app](https://safe-ride-app.vercel.app)
* **Video Presentation:** [https://drive.google.com/file/d/1E7H3HHtqns6uPADvhmsRDvWhSQ9T0eeK/view?usp=sharing]

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

## 🚶‍♀️ The User Flow

Here is the step-by-step journey of a passenger using SafeRide:

1. **Authentication:** The user securely registers or logs into the platform (powered by Firebase Auth).
2. **Vehicle Verification:** Before boarding a cab or auto, the user enters the vehicle's license plate number. SafeRide instantly queries the RTO database to confirm the vehicle's registration details, maker, and model.
3. **Contact Selection:** The user selects their designated emergency contacts from their profile.
4. **Trip Initiation & Automated Alert:** The user taps "Start Trip." SafeRide immediately triggers a Twilio-powered WhatsApp alert to the emergency contacts, providing the vehicle details and a live tracking link.
5. **Active Monitoring:** The passenger enjoys their ride while SafeRide monitors the active trip. The emergency contacts can track the live location entirely via the web link—no app download required.
6. **Trip Completion:** Upon reaching the destination, the user ends the trip. A final "Safe Arrival" automated WhatsApp message is sent to the contacts.
7. **Community Rating:** The user rates their experience and flags any suspicious behavior, updating the global database to protect future passengers.

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
    git clone https://github.com/passionate-coder26/SafeRide-app.git
    cd SafeRide-app

**2. Install dependencies**
    npm install

**3. Environment Variables**
Create a .env file in the root directory and add the necessary API keys:
    EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
    EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token

**4. Start the Expo server**
    npx expo start

*Press 'w' to open in a web browser, 'a' for Android emulator, or 'i' for iOS simulator.*

---

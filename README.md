# ⚡ AthleteOS: AI-Powered Performance Engine

AthleteOS is a professional-grade AI Workout Tracker and Performance Analytics platform designed for serious athletes. It combines deterministic performance tracking with generative AI intelligence to provide personalized coaching, biomarker analysis, and automated workout planning.

![AthleteOS Dashboard Preview](https://i.ibb.co/LztW7Xv/athleteos-preview.png)

## 🚀 Key Features

### 🧠 Generative Coaching
- **AI Daily Tips:** Personalized morning briefings based on your training history and goals.
- **Intelligent Workout Generator:** Automated training programs tailored to your sport and experience level.
- **Next-Set Suggestion:** Real-time AI recommendations for weight, reps, and RPE during your session.

### 📊 Performance Analytics
- **Biomarker Tracking:** Monitor metrics like Heart Rate Variability (HRV), Quality of Sleep, Body Weight, and Blood Pressure.
- **Volume & PR Tracking:** Visualized progression charts powered by Chart.js.
- **e1RM Calculation:** Real-time Estimated 1RM tracking using the Brzycki Formula.

### 🔌 Enterprise Architecture
- **Supabase Backend:** Real-time cloud synchronization and robust authentication.
- **App Singleton Pattern:** Centralized state management for superior performance and maintainability.
- **SaaS Lockdown Mode:** Secure admin controls for production deployment.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Modern Glassmorphism Design), JavaScript (ES6+)
- **Backend-as-a-Service:** [Supabase](https://supabase.com/) (Auth, PostgreSQL)
- **AI Orchestration:** [Google Gemini API](https://ai.google.dev/)
- **Visualizations:** [Chart.js](https://www.chartjs.org/)
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)

## ⚡ Setup & Deployment

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/athlete-os.git
   cd athlete-os
   ```

2. **Supabase Integration:**
   - Create a project at [Supabase](https://supabase.com/).
   - Execute the schema migration found in `supabase/schema.sql`.
   - Update `GLOBAL_CONFIG` in `app.js` with your Project URL and Anon Key.

3. **Gemini AI Integration:**
   - Obtain an API key from the [Google AI Studio](https://aistudio.google.com/).
   - Enter your key in the **Settings** panel within the application.

4. **Run Locally:**
   - Simply open `index.html` in any modern browser (or use a VS Code Live Server).

## 🛡️ Handoff Status: Professional Audit Complete

This codebase has undergone a full professional audit by Antigravity AI. 
- [x] Refactored into a modular `App` singleton architecture.
- [x] Implementation of SEO and Accessibility (Aria) standards.
- [x] Secure masking of sensitive API keys in the UI.
- [x] Robust asynchronous error handling for AI and Backend services.

---

Designed with ⚡ by **Antigravity AI** for the next generation of performance training.

# 📺 CampusDash TV

An executive, glassmorphic student command center built for 1080p Smart TVs, Fire OS interfaces, and desktop displays. **CampusDash TV** brings exam schedules, attendance tracking, focus timers, procedural rain audio, and AI voice assistance into a single ambient display.

🚀 **Live Demo:** https://campus-dash-tv.onrender.com/  
🐙 **Repository:** https://github.com/code-with-rajatkapoor/campus-dash-tv

---

## 🌟 Key Features

* **🎮 Spatial D-Pad Navigation:** Built-in keyboard and TV remote mapping (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`) across a clean grid layout without needing a mouse cursor.
* **🎨 Executive Theme Engine:** Dynamic visual themes designed for big screens. Press **`T`** to toggle between **Amazon Amber**, **Slate Navy**, **OLED Black**, and **Midnight Cyan**.
* **🎙️ AI Voice Assistant:** Hands-free voice queries powered by the Web Speech API and backend AI routes. Press **`V`** to ask about upcoming exams, attendance, or study concepts.
* **🌧️ Focus Studio & Audio Engine:** Integrated Pomodoro timer paired with a procedural Web Audio rain generator created purely in code without external media files.
* **📚 Academic Trackers:** Instant visibility for CSJMU lecture attendance calculations, mid-sem exam countdowns, active study notes, and interactive C Programming flashcards.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 Glassmorphism, Vanilla JS (ES6+), Web Speech API (`SpeechRecognition` & `SpeechSynthesis`), Web Audio API.
* **Backend:** Node.js, Express 5.
* **Hosting & Deployment:** Render (Continuous Deployment via Git).

---

## ⌨️ Controls & Shortcuts

| Key | Action |
| :--- | :--- |
| **`Arrow Keys`** | Navigate between dashboard cards (Spatial D-Pad) |
| **`Enter`** | Activate highlighted card / flip flashcards |
| **`T`** | Cycle visual theme modes |
| **`P`** | Start / Pause Pomodoro timer |
| **`V`** | Trigger AI Voice Assistant microphone |

---

## 🚀 Quick Start (Local Setup)

1. **Clone the repository:**in
   ```bash
   git clone [https://github.com/code-with-rajatkapoor/campus-dash-tv.git](https://github.com/code-with-rajatkapoor/campus-dash-tv.git)
   cd campus-dash-tv

2. install dependencies:
   npm install
   
3. Start the local server:
   node server.js

4. Open in browser:
Navigate to http://localhost:5000 (or http://localhost:3000). Press F11 for true fullscreen mode.

📄 License
Distributed under the MIT License. Built for hackathon demonstration.       

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default Initial Data
const defaultData = {
  exam: { title: "Mid-Sem Exams", target: "2026-11-15T00:00:00.000Z" },
  notes: [
    "Revise C Pointers & Memory Allocation",
    "Submit Hackathon Demo Video on Devpost"
  ],
  attendance: { attended: 28, total: 34 }
};

// Helpers for Data Persistence
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return defaultData;
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// REST API Routes
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json({ success: true, data });
});

app.post('/api/exam', (req, res) => {
  const { title, target } = req.body;
  const data = readData();
  if (title) data.exam.title = title;
  if (target) data.exam.target = target;
  writeData(data);
  res.json({ success: true, exam: data.exam });
});

app.post('/api/notes', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Note text required" });
  
  const data = readData();
  data.notes.push(text);
  writeData(data);
  res.json({ success: true, notes: data.notes });
});

app.post('/api/attendance', (req, res) => {
  const data = readData();
  data.attendance.attended += 1;
  data.attendance.total += 1;
  writeData(data);
  res.json({ success: true, attendance: data.attendance });
});

// Fallback Middleware (Bypasses path-to-regexp string parsing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 CampusDash Backend API active on http://localhost:${PORT}`);
});
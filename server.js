"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
const DATA_FILE = path.join(DATA_DIR, "data.json");
const DEFAULT_DATA = {
  notes: [
    "Revise C Pointers & Memory Allocation",
    "Complete CSJMU BCA Assignment"
  ],
  attendance: { attended: 30, total: 36 },
  exam: { title: "CSJMU Mid-Sem Exams", target: "2026-11-15T00:00:00.000Z" }
};

const candidatePublicDir = path.join(__dirname, "public");
const PUBLIC_DIR = fs.existsSync(path.join(candidatePublicDir, "index.html"))
  ? candidatePublicDir
  : __dirname;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(PUBLIC_DIR, { fallthrough: true, index: "index.html" }));

function normalizeData(value) {
  const data = value && typeof value === "object" ? value : {};
  const notes = Array.isArray(data.notes)
    ? data.notes.map((note) => String(note).trim()).filter(Boolean).slice(-100)
    : DEFAULT_DATA.notes.slice();

  let attendance = data.attendance || DEFAULT_DATA.attendance;
  if (Array.isArray(attendance)) {
    attendance = attendance.reduce((sum, subject) => ({
      attended: sum.attended + Math.max(0, Number(subject && (subject.attended ?? subject.present)) || 0),
      total: sum.total + Math.max(0, Number(subject && subject.total) || 0)
    }), { attended: 0, total: 0 });
  }
  const attended = Math.max(0, Math.floor(Number(attendance && attendance.attended) || 0));
  const total = Math.max(attended, Math.floor(Number(attendance && attendance.total) || 0));

  const suppliedExam = data.exam && typeof data.exam === "object" ? data.exam : {};
  const targetDate = new Date(suppliedExam.target || DEFAULT_DATA.exam.target);
  const exam = {
    title: String(suppliedExam.title || DEFAULT_DATA.exam.title).trim().slice(0, 160) || DEFAULT_DATA.exam.title,
    target: Number.isNaN(targetDate.getTime()) ? DEFAULT_DATA.exam.target : targetDate.toISOString()
  };

  return { notes, attendance: { attended, total }, exam };
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return normalizeData(parsed);
    }
  } catch (error) {
    console.error("Could not read data.json; using default dashboard data:", error.message);
  }
  return normalizeData(DEFAULT_DATA);
}

function saveData(data) {
  const normalized = normalizeData(data);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = DATA_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(normalized, null, 2), "utf8");
  fs.renameSync(tempFile, DATA_FILE);
  return normalized;
}

function validateText(value, fieldName, maxLength) {
  if (typeof value !== "string") return fieldName + " must be text.";
  const text = value.trim();
  if (!text) return fieldName + " cannot be empty.";
  if (text.length > maxLength) return fieldName + " must be " + maxLength + " characters or fewer.";
  return null;
}

app.get("/api/data", (req, res) => {
  res.json({ success: true, data: loadData() });
});

app.post("/api/data", (req, res) => {
  try {
    const saved = saveData({ ...loadData(), ...(req.body || {}) });
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error("Could not save dashboard data:", error.message);
    res.status(500).json({ success: false, error: "Could not save dashboard data." });
  }
});

app.post("/api/notes", (req, res) => {
  const issue = validateText(req.body && req.body.text, "Note", 500);
  if (issue) return res.status(400).json({ success: false, error: issue });
  try {
    const data = loadData();
    data.notes.push(req.body.text.trim());
    const saved = saveData(data);
    return res.json({ success: true, notes: saved.notes });
  } catch (error) {
    console.error("Could not save note:", error.message);
    return res.status(500).json({ success: false, error: "Could not save note." });
  }
});

app.post("/api/attendance", (req, res) => {
  try {
    const data = loadData();
    data.attendance.attended += 1;
    data.attendance.total += 1;
    const saved = saveData(data);
    return res.json({ success: true, attendance: saved.attendance });
  } catch (error) {
    console.error("Could not update attendance:", error.message);
    return res.status(500).json({ success: false, error: "Could not update attendance." });
  }
});

app.post("/api/exam", (req, res) => {
  const issue = validateText(req.body && req.body.title, "Exam title", 160);
  if (issue) return res.status(400).json({ success: false, error: issue });
  const suppliedTarget = req.body && req.body.target;
  const targetDate = new Date(suppliedTarget || loadData().exam.target);
  if (Number.isNaN(targetDate.getTime())) {
    return res.status(400).json({ success: false, error: "Exam date must be a valid date." });
  }
  try {
    const data = loadData();
    data.exam = { title: req.body.title.trim(), target: targetDate.toISOString() };
    const saved = saveData(data);
    return res.json({ success: true, exam: saved.exam });
  } catch (error) {
    console.error("Could not update exam:", error.message);
    return res.status(500).json({ success: false, error: "Could not update exam." });
  }
});

app.post(["/api/gemini", "/api/assistant"], (req, res) => {
  const incoming = req.body && (req.body.prompt || req.body.message || req.body.query);
  const query = typeof incoming === "string" ? incoming.trim().toLowerCase() : "";
  let text;

  if (query.includes("exam") || query.includes("schedule")) {
    text = "Your CSJMU Mid-Sem Exams start in 12 days. C Programming is your first paper.";
  } else if (query.includes("attendance")) {
    text = "Your current overall attendance is 82.3%. You are clear for mid-sem exams.";
  } else if (query.includes("pointer") || query.includes("c programming") || query.includes("code")) {
    text = "A pointer in C stores the memory address of another variable using the ampersand operator.";
  } else if (query.includes("note") || query.includes("task")) {
    text = "You have 3 active study notes. Don't forget to submit your Hackathon Pitch Deck.";
  } else {
    text = "CampusDash TV Assistant ready. All your student modules and schedules are synced.";
  }

  return res.json({ reply: text, text });
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: "API route not found." });
});

app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ success: false, error: "Request body must be valid JSON." });
  }
  console.error("Unhandled server error:", error);
  return res.status(500).json({ success: false, error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log("CampusDash TV server listening on port " + PORT);
});
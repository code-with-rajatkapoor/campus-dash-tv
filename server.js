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

app.post("/api/gemini", async (req, res) => {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim() || String((req.body && req.body.apiKey) || "").trim();
  if (!apiKey) return res.status(400).json({ reply: "Gemini API key is missing. Set GEMINI_API_KEY in Render or provide apiKey." });

  const userPrompt = req.body && (req.body.prompt || req.body.message || req.body.query);
  if (typeof userPrompt !== "string" || !userPrompt.trim()) {
    return res.status(400).json({ reply: "Please provide a question for Gemini." });
  }
  if (userPrompt.length > 12000) {
    return res.status(400).json({ reply: "Please keep the question under 12,000 characters." });
  }
  if (typeof fetch !== "function") {
    return res.status(500).json({ reply: "This server requires Node.js 18 or newer for fetch." });
  }

  const candidates = [
    { name: "gemini-2.5-flash", version: "v1beta" },
    { name: "gemini-1.5-flash", version: "v1" },
    { name: "gemini-2.0-flash", version: "v1beta" }
  ];
  const wrappedPrompt = "You are CampusDash TV Voice Assistant. Keep your response brief, clear, conversational, and under 2-3 sentences. Question: " + userPrompt.trim();
  let lastStatus = 502;
  let lastError = "No Gemini model returned a response.";

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const url = "https://generativelanguage.googleapis.com/" + candidate.version + "/models/" + candidate.name + ":generateContent?key=" + encodeURIComponent(apiKey);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: wrappedPrompt }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
        }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastStatus = response.status;
        lastError = data.error && data.error.message || "Gemini returned HTTP " + response.status + ".";
        console.error("Gemini " + candidate.version + "/" + candidate.name + " failed (HTTP " + response.status + "):", lastError);
        if (response.status === 400 || response.status === 401 || response.status === 403) break;
        continue;
      }
      const text = (data.candidates || [])
        .flatMap((item) => item.content && item.content.parts || [])
        .map((part) => part.text || "")
        .join("")
        .trim();
      if (text) return res.json({ reply: text });
      lastStatus = 502;
      lastError = "Gemini returned an empty response.";
    } catch (error) {
      if (error && error.name === "AbortError") {
        lastStatus = 504;
        lastError = candidate.name + " timed out after 3 seconds.";
        console.warn(lastError + " Trying the next model.");
      } else {
        lastStatus = 502;
        lastError = error.message || "Could not connect to Gemini.";
        console.error("Gemini request failed for " + candidate.name + ":", lastError);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastStatus === 429) return res.status(200).json({ reply: "Gemini rate limit or quota reached. Check your Google AI Studio quota and retry later." });
  if (lastStatus === 503) return res.status(200).json({ reply: "Gemini is temporarily unavailable. Please retry shortly." });
  if (lastStatus === 504) return res.status(200).json({ reply: "Gemini models did not respond within 3 seconds each. Please retry." });
  return res.status(502).json({ reply: "No available Gemini model responded: " + lastError });
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










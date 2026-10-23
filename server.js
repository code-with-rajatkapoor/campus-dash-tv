const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Persistent storage helpers
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
      console.error("Error reading data.json:", err);
    }
  }
  return {
    notes: [
      "Revise C Pointers & Memory Management",
      "Complete CSJMU BCA Assignment"
    ],
    attendance: [
      { subject: "Computer Fundamentals", present: 18, total: 20 },
      { subject: "C Programming", present: 16, total: 20 }
    ]
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving data.json:", err);
  }
}

// Data API routes
app.get('/api/data', (req, res) => {
  res.json(loadData());
});

app.post('/api/data', (req, res) => {
  saveData(req.body);
  res.json({ success: true, data: req.body });
});

// Gemini AI route
app.post('/api/gemini', async (req, res) => {
  try {
    const userPrompt = req.body.prompt || req.body.message || req.body.query;

    if (!userPrompt) {
      return res.status(400).json({ reply: "Please provide a query." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        reply: "GEMINI_API_KEY is missing. Please add it to your environment variables." 
      });
    }

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      }
    );

    const data = await apiResponse.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.json({ reply: aiReply, text: aiReply });
    } else if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(500).json({ 
        reply: `Gemini Error: ${data.error.message || "Unable to process AI request."}` 
      });
    } else {
      return res.status(500).json({ reply: "Unexpected AI response format." });
    }

  } catch (err) {
    console.error("Server Error in /api/gemini:", err);
    return res.status(500).json({ reply: "Failed to connect to Gemini AI." });
  }
});

// Catch-all middleware fallback for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 CampusDash TV Server running on port ${PORT}`);
});
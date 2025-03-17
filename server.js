const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const app = express();
const port = 3000;
const fs = require("fs");
// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });
const cors = require("cors");
app.use(cors());

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const fakeTranscription = "This is a sample transcription.";

  res.json({ text: fakeTranscription }); // Return a JSON response

  const audioPath = `uploads/${req.file.originalname}`;
  fs.writeFileSync(audioPath, req.file.buffer);

  exec(
    "uv run /Users/soyeonjang/github/digital-plant/process/process_audio.py uploads/audio.wav",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Python script stderr: ${stderr}`);
        return;
      }
      console.log(`Python script stdout: ${stdout}`);
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

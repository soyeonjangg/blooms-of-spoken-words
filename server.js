const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const { exec } = require("child_process");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const port = 3001;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const server = createServer(app);
const io = new Server(server);

server.listen(3000, () => {
  console.log("webserver started: http://localhost:3000");
});

app.use(express.static("public"));

let lastSentiment = null;

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const audioPath = `uploads/${req.file.originalname}`;
  fs.writeFileSync(audioPath, req.file.buffer);
  console.log("Going to process the audio..");
  isProcessing = true;

  exec(
    "uv run /Users/soyeonjang/github/digital-plant/process/process_audio.py uploads/audio.wav",
    (error, stdout, stderr) => {
      if (error) {
        console.error(
          `Error executing Python script remotely: ${error.message}`
        );
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

app.post("/sentiment", (req, res) => {
  if (req.body.sentiment) {
    lastSentiment = req.body.sentiment;
    lastSentiment = JSON.parse(lastSentiment);
    console.log("Received sentiment:", lastSentiment.sentiment);
    res.status(200).send("Sentiment received");
    io.emit("sentiment", {
      sentiment: lastSentiment.sentiment,
      numFlower: lastSentiment.numFlower,
    });
  } else {
    res.status(400).send("Invalid request");
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});

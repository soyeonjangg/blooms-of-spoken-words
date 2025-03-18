const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

// const { Server } = require("socket.io");
const { exec } = require("child_process");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const port = 3001;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// const server = createServer(app);
const server = createServer(app);
const io = new Server(server);

server.listen(3000, () => {
  console.log("webserver started: http://localhost:3000");
});

app.use(express.static("public"));

let lastSentiment = null;

io.on("connection", (socket) => {
  console.log("A client connected");

  if (lastSentiment) {
    socket.emit("sentiment", { sentiment: lastSentiment });
  }

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  // const fakeTranscription = "This is a sample transcription.";

  // res.json({ text: fakeTranscription }); // Return a JSON response

  const audioPath = `uploads/${req.file.originalname}`;
  fs.writeFileSync(audioPath, req.file.buffer);

  // const remotePCUser = "soyeon-jang";
  // const remotePCIP = "192.168.2.88"; // Your Linux PC's IP
  // const remotePath = "/home/soyeon-jang/github/digital-plant/uploads"; // Change this to your actual directory

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
    console.log("Received sentiment:", lastSentiment);
    res.status(200).send("Sentiment received");

    io.emit("sentiment", { sentiment: lastSentiment });
  } else {
    res.status(400).send("Invalid request");
  }
});

// fetch sentiment
// app.get("/sentiment", (req, res) => {
//   res.json({ sentiment: lastSentiment });
// });

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});

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

function sendSentimentToServer(sentiment, numFlower) {
  // Create the JSON payload
  const payload = {
    sentiment: sentiment,
    numFlower: numFlower,
  };

  console.log("Sending sentiment to server:", payload);

  // Send the POST request
  fetch("http://localhost:3001/sentiment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload), // payload to a JSON string
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Parse the JSON response
    })
    .then((data) => {
      console.log("Server response:", data);
    })
    .catch((error) => {
      console.error("Error sending sentiment to server:", error);
    });
}

let transcribedText = "";

app.post("/upload-text", (req, res) => {
  if (req.body.text) {
    transcribedText = req.body.text; // Update the global variable
    console.log("Received transcribed text:", transcribedText);

    // Send a valid JSON response
    res.status(200).json({ text: `Processed: ${transcribedText}` });

    exec(
      `uv run /Users/soyeonjang/github/digital-plant/process/process_audio.py`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Python script: ${error.message}`);
          return res.status(500).json({ error: "Error processing text" });
        }
        if (stderr) {
          console.error(`Python script stderr: ${stderr}`);
        }
        console.log(`Python script stdout: ${stdout}`);
      }
    );
  } else {
    console.error("No text provided in the request body.");
    res.status(400).send("No text provided");
  }
});

app.get("/upload-text", (req, res) => {
  if (transcribedText) {
    res.status(200).send(transcribedText);
  } else {
    res.status(404).send("No transcribed text available");
  }
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

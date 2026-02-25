import express from "express";
import dotenv from "dotenv";
import sdk from "microsoft-cognitiveservices-speech-sdk";
import cors from "cors";

dotenv.config();

const app = express();

/* ─── Middleware ─── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─── Azure Speech Endpoint ─── */
app.post("/speak", (req, res) => {

  const text = req.body?.text;

  if (!text) {
    return res.status(400).send("No text provided");
  }

  console.log("Characters received:", text.length);

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );

  speechConfig.speechSynthesisVoiceName = "en-GB-RyanNeural";
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(
    speechConfig,
    null
  );

  synthesizer.speakTextAsync(
    text,
    result => {

      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {

        const audioBuffer = Buffer.from(result.audioData);

        res.set({
          "Content-Type": "audio/mpeg",
          "Content-Disposition": "attachment; filename=revision.mp3",
          "Content-Length": audioBuffer.length
        });

        res.send(audioBuffer);

      } else {
        console.error("Speech synthesis failed:", result);
        res.status(500).send("Speech synthesis failed");
      }

      synthesizer.close();
    },
    err => {
      console.error("Azure error:", err);
      res.status(500).send("Error occurred");
      synthesizer.close();
    }
  );
});

/* ─── Start Server ─── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
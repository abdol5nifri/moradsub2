const express = require('express');
const path = require('path');
const { fetchTranscript } = require('youtube-transcript-plus');

const app = express();
const PORT = process.env.PORT || 3000;

function getVideoID(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/transcripts', async (req, res) => {
  const videoUrl = req.query.url;
  const videoId = getVideoID(videoUrl);
  if (!videoId) return res.json({ languages: [] });

  const langsToTry = ['ar', 'en', 'fr', 'es'];
  const available = [];

  for (let lang of langsToTry) {
    try {
      await fetchTranscript(videoId, { lang });
      available.push(lang);
    } catch (e) {}
  }

  res.json({ languages: available });
});

app.get('/api/transcript', async (req, res) => {
  const videoUrl = req.query.url;
  const lang = req.query.lang;
  const videoId = getVideoID(videoUrl);
  if (!videoId || !lang) return res.status(400).send('Bad Request');

  try {
    const segments = await fetchTranscript(videoId, { lang });
    const text = segments.map(s => s.text).join('\n');
    res.json({ text });
  } catch (e) {
    res.status(500).send('Error fetching transcript');
  }
});

app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
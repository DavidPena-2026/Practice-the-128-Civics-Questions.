import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice } = req.body;

  // Input validation — protects against abuse
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long' });
  }

  // Map "male"/"female" to the actual Google voice names
  const voiceName = voice === 'male'
    ? 'en-US-Chirp3-HD-Enceladus'
    : 'en-US-Chirp3-HD-Autonoe';

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'en-US', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(response.audioContent);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
}

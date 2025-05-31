const sdk = require('microsoft-cognitiveservices-speech-sdk');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, languageCode } = req.body;
  
  
  console.log('Received request:', { text: text.substring(0, 50) + '...', languageCode });

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const serviceRegion = process.env.AZURE_SERVICE_REGION || process.env.AZURE_SPEECH_REGION;

 
  console.log('Environment variables:', { 
    speechKey: speechKey ? 'Present (hidden)' : 'Missing',
    serviceRegion
  });
  if (!speechKey || !serviceRegion) {
    console.error('Missing Azure credentials. Make sure AZURE_SPEECH_KEY and AZURE_SERVICE_REGION are set in .env');
    return res.status(500).json({ error: 'Azure Speech Service credentials are missing' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 5000) {
    return res.status(413).json({ error: 'Text is too long. Please limit to 5000 characters.' });
  }


  let voiceName;
  switch (languageCode) {
    case 'pt-PT':
      voiceName = 'pt-PT-DuarteNeural';
      break;
    case 'es-ES':
      voiceName = 'es-ES-ElviraNeural';
      break;
    case 'fr-FR':
      voiceName = 'fr-FR-DeniseNeural';
      break;
    case 'de-DE':
      voiceName = 'de-DE-KatjaNeural';
      break;
    case 'en-US':
    default:
      voiceName = 'en-US-JennyNeural';
  }

  console.log(`Using voice: ${voiceName} for language: ${languageCode}`);

  try {
  const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, serviceRegion);
  speechConfig.speechSynthesisVoiceName = voiceName;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  synthesizer.speakTextAsync(
    text,
    (result) => {
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log('Speech synthesis completed successfully');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(result.audioData));
      } else {
        console.error('Speech synthesis failed:', result.errorDetails);
        res.status(500).json({ error: `Speech synthesis failed: ${result.errorDetails}` });
      }
      synthesizer.close();
    },
    (error) => {
      console.error('Error synthesizing speech:', error);
      res.status(500).json({ error: `Error synthesizing speech: ${error.message || error}` });
      synthesizer.close();
    }
  );
} catch (error) {
  console.error('Exception in speech synthesis:', error);
  res.status(500).json({ error: `Exception in speech synthesis: ${error.message || error}` });
}
};
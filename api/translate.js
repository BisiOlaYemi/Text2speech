const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

  console.log('Received translate request:', { 
    textLength: text?.length,
    sourceLanguage,
    targetLanguage
  });

 
  const translatorKey = process.env.AZURE_TRANSLATOR_KEY;
  const translatorRegion = process.env.AZURE_TRANSLATOR_REGION || process.env.AZURE_SERVICE_REGION;
  const translatorEndpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com/';

  console.log('Environment variables:', { 
    translatorKey: translatorKey ? 'Present (hidden)' : 'Missing',
    translatorRegion,
    translatorEndpoint
  });

  if (!translatorKey || !translatorRegion) {
    console.error('Missing Azure Translator credentials. Make sure AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION are set in .env');
    return res.status(500).json({ error: 'Azure Translator credentials are missing' });
  }

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and target language are required' });
  }

  if (text.length > 10000) {
    return res.status(413).json({ error: 'Text is too long. Please limit to 10,000 characters.' });
  }

  
  if (sourceLanguage === targetLanguage) {
    return res.json({ translatedText: text, detectedLanguage: sourceLanguage });
  }

  try {
    const translatorUrl = `${translatorEndpoint}/translate`;
    
    const headers = {
      'Ocp-Apim-Subscription-Key': translatorKey,
      'Ocp-Apim-Subscription-Region': translatorRegion,
      'Content-type': 'application/json',
      'X-ClientTraceId': uuidv4().toString()
    };

    const params = {
      'api-version': '3.0',
      'from': sourceLanguage,
      'to': targetLanguage
    };

    const body = [{
      'text': text
    }];

    console.log('Making request to Azure Translator API...');
    console.log(`URL: ${translatorUrl}`);
    console.log(`Region: ${translatorRegion}`);

    const response = await axios.post(translatorUrl, body, {
      headers: headers,
      params: params,
      timeout: 30000
    });

    if (response.data && response.data.length > 0) {
      const translation = response.data[0];
      
      if (translation.translations && translation.translations.length > 0) {
        const translatedText = translation.translations[0].text;
        const detectedLanguage = translation.detectedLanguage?.language || sourceLanguage;
        
        console.log('Translation completed successfully');
        console.log(`Original: ${text.substring(0, 50)}...`);
        console.log(`Translated: ${translatedText.substring(0, 50)}...`);

        return res.json({
          translatedText: translatedText,
          detectedLanguage: detectedLanguage,
          confidence: translation.detectedLanguage?.score || 1.0
        });
      } else {
        console.error('No translations in response:', translation);
        return res.status(500).json({ error: 'No translation returned from Azure' });
      }
    } else {
      console.error('Invalid response structure:', response.data);
      return res.status(500).json({ error: 'Invalid response from Azure Translator' });
    }

  } catch (error) {
    console.error('Azure Translator API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response?.data;
      
      if (status === 401 || status === 403) {
        return res.status(500).json({ error: 'Azure Translator authentication failed. Please check your keys and region.' });
      } else if (status === 429) {
        return res.status(429).json({ error: 'Translation quota exceeded. Please try again later.' });
      } else {
        return res.status(500).json({ 
          error: `Azure Translator API error: ${status} - ${errorData?.error?.message || 'Unknown error'}` 
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Translation request timed out. Please try again.' });
    } else {
      return res.status(500).json({ error: `Translation service error: ${error.message}` });
    }
  }
};
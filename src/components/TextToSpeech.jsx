import React, { useState, useEffect } from 'react';

const TextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState(''); 
  const [translatedText, setTranslatedText] = useState('');
  const [languageCode, setLanguageCode] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audio, setAudio] = useState(null);

  const languages = [
    { code: 'en-US', name: 'English (US)', voice: 'en-US-JennyNeural', translateCode: 'en' },
    { code: 'pt-PT', name: 'Portuguese', voice: 'pt-PT-DuarteNeural', translateCode: 'pt' },
    { code: 'es-ES', name: 'Spanish', voice: 'es-ES-ElviraNeural', translateCode: 'es' },
    { code: 'fr-FR', name: 'French', voice: 'fr-FR-DeniseNeural', translateCode: 'fr' },
    { code: 'de-DE', name: 'German', voice: 'de-DE-KatjaNeural', translateCode: 'de' }
  ];
  
  const MAX_TEXT_LENGTH = 5000;

  
  useEffect(() => {
    setTranslatedText('');
    setError(null);
  }, [languageCode]);

  
  const isLikelyEnglish = (inputText) => {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'a', 'an'];
    const words = inputText.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    return englishWordCount > words.length * 0.1; 
  };

  const handlePlay = async () => {
    try {
      if (!text.trim()) {
        setError('Please enter some text to convert to speech.');
        return;
      }

      if (text.length > MAX_TEXT_LENGTH) {
        setError(`Text is too long. Please limit to ${MAX_TEXT_LENGTH} characters.`);
        return;
      }

      setIsLoading(true);
      setError(null);

      
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      let textToSynthesize = text;
      const selectedLanguage = languages.find(lang => lang.code === languageCode);

      
      if (languageCode !== 'en-US' && isLikelyEnglish(text) && selectedLanguage?.translateCode) {
        try {
          console.log(`Attempting to translate to: ${selectedLanguage.translateCode}`);
          
          
          const translationResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, targetLanguage: selectedLanguage.translateCode }),
          });

          if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            if (translationData.translatedText) {
              textToSynthesize = translationData.translatedText;
              setTranslatedText(translationData.translatedText);
              console.log('Translation successful:', translationData.translatedText.substring(0, 50) + '...');
            }
          } else {
            const errorData = await translationResponse.json();
            throw new Error(errorData.error || `Translation API returned status: ${translationResponse.status}`);
          }
        } catch (translationError) {
          console.error('Translation error:', translationError);
          setError(`Translation failed: ${translationError.message}. Using original text for speech.`);
          
          textToSynthesize = text;
          setTranslatedText(''); 
        }
      } else {
        console.log('Skipping translation - using original text');
      }

      
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSynthesize, languageCode }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const newAudio = new Audio(audioUrl);

        newAudio.onended = () => {
          setIsPlaying(false);
        };

        newAudio.onerror = () => {
          setError('Error playing audio. Please try again.');
          setIsPlaying(false);
        };

        setAudio(newAudio);
        await newAudio.play();
        setIsPlaying(true);
      } else {
        const errorText = await response.text();
        setError(`Speech synthesis failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      setError('An unexpected error occurred: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    if (translatedText) {
      setTranslatedText('');
    }
  };

  const handleLanguageChange = (e) => {
    setLanguageCode(e.target.value);
    
    setTranslatedText('');
  };

  
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      }
    };
  }, [audio]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-3">
            Olayemi, Jose and Melford's 2 in 1 Text to Speech Converter
          </h1>
          <p className="text-xl text-gray-600">
            Transform and Translate your text with automatic translation into natural-sounding speech in multiple languages 
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-indigo-100">
          <div className="md:flex">
            
            <div className="md:w-2/3 p-8">
              <div className="mb-6">
                <label htmlFor="language" className="block text-lg font-semibold text-gray-800 mb-2">
                  Choose Your Language
                </label>
                <div className="relative">
                  <select
                    id="language"
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 shadow-sm text-gray-700 appearance-none"
                    value={languageCode}
                    onChange={handleLanguageChange}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="text-input" className="block text-lg font-semibold text-gray-800 mb-2">
                  Enter Your Text
                </label>
                <div className="relative">
                  <textarea
                    id="text-input"
                    className="w-full h-80 px-5 py-4 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 shadow-sm resize-none text-gray-700"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Type or paste your text here (English text will be automatically translated)..."
                    style={{ fontSize: '1.05rem', lineHeight: '1.5' }}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {text.length} / {MAX_TEXT_LENGTH} characters
                  </div>
                </div>
              </div>
              
              
              {translatedText && languageCode !== 'en-US' && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    Translated Text ({languages.find(l => l.code === languageCode)?.name}):
                  </h4>
                  <p className="text-green-900">{translatedText}</p>
                </div>
              )}
            </div>
            
            
            <div className="md:w-1/3 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 flex flex-col">
              <div className="flex-grow">
                <h2 className="text-3xl font-bold text-indigo-800 mb-6">Speech Controls</h2>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-gray-700 mb-4">
                      {languageCode !== 'en-US' && isLikelyEnglish(text) && text.trim() 
                        ? 'English text will be automatically translated using Azure Translator before speech synthesis' 
                        : 'Click the button below to convert your text to speech'
                      }
                    </p>
                    
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      className={`w-full py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 ${
                        isPlaying 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                      } text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50`}
                      onClick={isPlaying ? handleStop : handlePlay}
                      disabled={isLoading || !text.trim()}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-lg">Processing...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                          <span className="text-lg">Stop</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-lg">Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl shadow-md border border-indigo-50">
                    <h3 className="font-semibold text-xl text-gray-800 mb-3">Features</h3>
                    <ul className="text-gray-600 space-y-3">
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Ultra-realistic Azure Neural voices
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Support for multiple languages
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Powered by Azure AI Services
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Automatic Azure translation & speech
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 pt-5 border-t border-indigo-100">
                <p className="text-sm text-gray-500 text-center">
                  Powered by Azure Cognitive Services for translation and neural text-to-speech
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
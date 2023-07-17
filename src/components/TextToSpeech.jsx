import React, { useState, useEffect } from 'react';

const TextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [speech, setSpeech] = useState(null);

  useEffect(() => {
    // Initialize the speech synthesis API
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    setSpeech(utterance);

    return () => {
      // Clean up the speech synthesis API
      synth.cancel();
    };
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    speech.text = text;
    window.speechSynthesis.speak(speech);
  };

  const handleStop = () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  const defaultText = `I am writing to express my strong interest in the Front-end Developer position at any company that is interested solely in hiring a smart and intelligent individual. With a zeal for web development and a track record of delivering high-quality projects, I believe that my skills and experience align perfectly with the requirements of the role. I have a solid foundation in web development, backed by 4+ years of professional experience in designing and developing robust web applications.
  Throughout my career, I have consistently demonstrated expertise in front-end and back-end development, employing
  modern technologies and frameworks such as HTML5, CSS, JavaScript(Reactjs/Nextjs) Nodejs, PHP, SQL, and Django to
  create exceptional user experiences. One of my notable achievements includes building a sophisticated web application
  from scratch using cutting-edge technologies. This project resulted in a significant improvement of 55% in user engagement,
  showcasing my ability to deliver impactful solutions that drive positive results. Additionally, I have experience in providing
  continuous maintenance, implementing CI/CD pipelines, and collaborating with cross-functional teams to ensure optimal website
  performance and reliability.
  `;

  useEffect(() => {
    setText(defaultText);
  }, []);

  return (
    <div className="flex items-center">
      <div className="w-2/3 mt-24">
        <textarea
          className="w-full p-2 border border-gray-300 rounded"
          rows="19"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="w-1/4 ml-4 mt-24">
        <button
          className={`w-full py-2 px-2 rounded-full ${
            isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
          onClick={isPlaying ? handleStop : handlePlay}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
    </div>
  );
};

export default TextToSpeech;

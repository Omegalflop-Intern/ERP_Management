import React, { useEffect, useState } from 'react';

export default function Typewriter({
  words = [],
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseTime = 1800,
  className = '',
  cursorClassName = '',
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const fullWord = words[currentWordIndex];
    let timeout;

    if (!isDeleting) {
      // Typing phase
      if (currentText.length < fullWord.length) {
        timeout = setTimeout(() => {
          setCurrentText(fullWord.slice(0, currentText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing word, pause before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      }
    } else {
      // Deleting phase
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(fullWord.slice(0, currentText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className="inline-flex items-center align-baseline">
      <span className={className}>{currentText || '\u00A0'}</span>
      <span
        className={`inline-block w-[3px] h-[0.9em] ml-1.5 bg-blue-500 animate-pulse rounded-full ${cursorClassName}`}
        aria-hidden="true"
      />
    </span>
  );
}

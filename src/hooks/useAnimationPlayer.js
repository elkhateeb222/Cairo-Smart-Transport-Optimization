import { useState, useEffect, useRef } from 'react';

export const useAnimationPlayer = (steps = []) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100); // ms per step
  
  const timerRef = useRef(null);

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  const play = () => {
    if (currentStepIndex < steps.length - 1) setIsPlaying(true);
  };
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };
  const stepForward = () => {
    setIsPlaying(false);
    setCurrentStepIndex(p => Math.min(p + 1, steps.length - 1));
  };
  const stepBackward = () => {
    setIsPlaying(false);
    setCurrentStepIndex(p => Math.max(p - 1, 0));
  };

  return {
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    isPlaying,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    speed,
    setSpeed,
    progress: steps.length > 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0
  };
};

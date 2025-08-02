import { DetectedFace } from './faceDetection';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectWinners(faces: DetectedFace[], count: number = 1): DetectedFace[] {
  if (faces.length === 0) return [];
  
  const shuffled = shuffleArray(faces);
  return shuffled.slice(0, Math.min(count, faces.length));
}

export function animateWinnerSelection(
  faces: DetectedFace[],
  onUpdate: (currentFaces: DetectedFace[]) => void,
  onComplete: (winners: DetectedFace[]) => void,
  winnerCount: number = 1
): void {
  const animationDuration = 2000;
  const intervalTime = 100;
  const steps = animationDuration / intervalTime;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    const randomFaces = shuffleArray(faces).slice(0, winnerCount);
    onUpdate(randomFaces);
    
    currentStep++;
    
    if (currentStep >= steps) {
      clearInterval(interval);
      const finalWinners = selectWinners(faces, winnerCount);
      onComplete(finalWinners);
    }
  }, intervalTime);
}
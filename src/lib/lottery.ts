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
  const phases = [
    { duration: 1000, interval: 50 },   // 快速閃爍階段
    { duration: 1000, interval: 100 },  // 中等速度階段
    { duration: 1000, interval: 200 },  // 逐漸減慢階段
    { duration: 1000, interval: 400 }   // 最後減速階段
  ];
  
  let phaseIndex = 0;
  let stepInPhase = 0;
  
  function runPhase() {
    if (phaseIndex >= phases.length) {
      // 動畫結束，選出最終贏家
      const finalWinners = selectWinners(faces, winnerCount);
      onComplete(finalWinners);
      return;
    }
    
    const currentPhase = phases[phaseIndex];
    const stepsInPhase = currentPhase.duration / currentPhase.interval;
    
    const interval = setInterval(() => {
      // 根據階段調整隨機選擇的頻率和強度
      let randomFaces: DetectedFace[];
      
      if (phaseIndex === 0) {
        // 第一階段：完全隨機
        randomFaces = shuffleArray(faces).slice(0, winnerCount);
      } else if (phaseIndex === 1) {
        // 第二階段：稍微偏向某些人臉
        const shuffled = shuffleArray(faces);
        randomFaces = shuffled.slice(0, winnerCount);
      } else if (phaseIndex === 2) {
        // 第三階段：開始收斂到候選人
        const candidates = shuffleArray(faces).slice(0, Math.min(winnerCount * 3, faces.length));
        randomFaces = shuffleArray(candidates).slice(0, winnerCount);
      } else {
        // 最後階段：在最終候選人中切換
        const finalCandidates = shuffleArray(faces).slice(0, Math.min(winnerCount * 2, faces.length));
        randomFaces = shuffleArray(finalCandidates).slice(0, winnerCount);
      }
      
      onUpdate(randomFaces);
      
      stepInPhase++;
      
      if (stepInPhase >= stepsInPhase) {
        clearInterval(interval);
        phaseIndex++;
        stepInPhase = 0;
        
        // 階段間短暫停頓
        setTimeout(() => {
          runPhase();
        }, 100);
      }
    }, currentPhase.interval);
  }
  
  runPhase();
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, Music, Gamepad2, X, AlertTriangle, Zap, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 80;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "DATA_STREAM_01",
    artist: "SYNTH_CORE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/200/200"
  },
  {
    id: 2,
    title: "NEURAL_LINK_ERR",
    artist: "VOID_WALKER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/200/200"
  },
  {
    id: 3,
    title: "VOID_SIGNAL",
    artist: "NULL_PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch3/200/200"
  }
];

// --- Components ---

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [trail, setTrail] = useState<Point[]>([]);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const moveSnake = () => {
      const currentSnake = snakeRef.current;
      const newHead = {
        x: (currentSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (currentSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        generateFood(newSnake);
      } else {
        const removedTail = newSnake.pop();
        if (removedTail) {
          setTrail(prev => [removedTail, ...prev].slice(0, 8));
        }
      }

      snakeRef.current = newSnake;
      setSnake(newSnake);
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [isGameOver, isPaused, direction, food.x, food.y, score]);

  const generateFood = (currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood!.x && segment.y === newFood!.y)) {
        break;
      }
    }
    setFood(newFood);
  };

  const resetGame = () => {
    snakeRef.current = INITIAL_SNAKE;
    setSnake(INITIAL_SNAKE);
    setTrail([]);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  // --- Music Logic ---

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = dir === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.log("DATA_STREAM_INTERRUPTED", e));
    }
  }, [currentTrackIndex]);

  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-mono selection:bg-[#ff00ff]/30 overflow-hidden flex flex-col items-center justify-center p-4 relative">
      <div className="fixed inset-0 bg-static pointer-events-none z-50" />
      <div className="scanline z-50" />
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 screen-tear">
        
        {/* Left Panel: Audio Core */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glitch-border bg-black p-4 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-[#ff00ff] pb-2">
              <Music className="w-4 h-4 text-[#ff00ff]" />
              <h2 className="text-[10px] font-pixel text-[#ff00ff]">AUDIO_CORE</h2>
            </div>

            <div className="relative aspect-square mb-4 border border-[#00ffff]/30">
              <img 
                src={currentTrack.cover} 
                alt="ENCRYPTED_ASSET"
                className={`w-full h-full object-cover grayscale contrast-150 ${isPlaying ? 'animate-pulse' : ''}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#ff00ff]/10 mix-blend-screen" />
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-pixel truncate text-glitch-cyan">{currentTrack.title}</h3>
              <p className="text-[10px] text-[#ff00ff] mt-1">{currentTrack.artist}</p>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => skipTrack('prev')} className="p-1 hover:text-[#ff00ff] transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 border-2 border-[#ff00ff] text-[#ff00ff] flex items-center justify-center hover:bg-[#ff00ff] hover:text-black transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </button>
              <button onClick={() => skipTrack('next')} className="p-1 hover:text-[#ff00ff] transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <audio ref={audioRef} src={currentTrack.url} onEnded={() => skipTrack('next')} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glitch-border bg-black p-4"
          >
            <div className="flex items-center justify-between text-[10px] mb-2">
              <span className="text-[#ff00ff]">GAIN_LVL</span>
              <span>80%</span>
            </div>
            <div className="h-1 bg-[#ff00ff]/20">
              <div className="h-full bg-[#ff00ff] w-[80%]" />
            </div>
          </motion.div>
        </div>

        {/* Center Panel: Logic Grid */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glitch-border bg-black p-2 relative"
          >
            <div className="flex items-center justify-between mb-2 px-2 border-b border-[#00ffff]/30 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00ffff]" />
                <span className="text-[8px] font-pixel">LOGIC_GRID_V4</span>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[8px] text-[#ff00ff]">DATA_PTS</p>
                  <p className="text-lg font-pixel text-glitch-cyan">{score.toString().padStart(4, '0')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-[#ff00ff]">MAX_REACH</p>
                  <p className="text-lg font-pixel text-glitch-magenta">{highScore.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </div>

            <div 
              className="aspect-square bg-[#0a0a0a] relative overflow-hidden border border-[#00ffff]/20"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                display: 'grid'
              }}
            >
              {/* Trail */}
              {trail.map((segment, i) => (
                <motion.div
                  key={`trail-${segment.x}-${segment.y}-${i}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bg-[#ff00ff]/40"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                  }}
                />
              ))}

              {/* Snake */}
              {snake.map((segment, i) => (
                <div
                  key={`${segment.x}-${segment.y}-${i}`}
                  className={`absolute flex items-center justify-center ${
                    i === 0 ? 'text-[#00ffff] z-10' : 'text-[#00ffff]/40'
                  }`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                  }}
                >
                  <X className={`w-full h-full ${i === 0 ? 'stroke-[4]' : 'stroke-[2]'}`} />
                </div>
              ))}

              {/* Food */}
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="absolute bg-[#ff00ff]"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                }}
              />

              {/* Overlays */}
              <AnimatePresence>
                {isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-4"
                  >
                    <AlertTriangle className="w-12 h-12 text-[#ff00ff] mb-4 animate-bounce" />
                    <h2 className="text-xl font-pixel text-[#ff00ff] mb-2">SYSTEM_CRITICAL</h2>
                    <p className="text-[10px] mb-8">RECOVERY_REQUIRED_SCORE:{score}</p>
                    <button 
                      onClick={resetGame}
                      className="px-6 py-2 border-2 border-[#00ffff] text-[#00ffff] font-pixel text-[10px] hover:bg-[#00ffff] hover:text-black transition-all"
                    >
                      REBOOT_SEQUENCE
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {isPaused && !isGameOver && (
                <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="w-16 h-16 border-2 border-[#00ffff] flex items-center justify-center hover:bg-[#00ffff] hover:text-black transition-all"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                  <p className="mt-4 text-[8px] font-pixel animate-pulse">INIT_INPUT_SPACE</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between px-2 text-[8px] font-pixel text-[#00ffff]/40">
              <span>CMD:ARROWS</span>
              <span>CMD:SPACE_PAUSE</span>
            </div>
          </motion.div>
        </div>

        {/* Right Panel: System Status */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glitch-border bg-black p-4"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-[#00ffff]/30 pb-2">
              <Zap className="w-4 h-4 text-[#00ffff]" />
              <h2 className="text-[10px] font-pixel">SYS_STATUS</h2>
            </div>
            <div className="space-y-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#ff00ff]">NODES_ACTV</span>
                <span>1,284</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ff00ff]">DATA_CONSUMED</span>
                <span>42.8M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff00]">INTEGRITY</span>
                <span>STABLE</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 glitch-border bg-black p-4 flex flex-col"
          >
            <h2 className="text-[10px] font-pixel text-[#ff00ff] mb-4">SIGNAL_WAVE</h2>
            <div className="flex-1 flex items-end justify-between gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isPlaying ? [`${10 + Math.random() * 80}%`, `${5 + Math.random() * 90}%`, `${20 + Math.random() * 50}%`] : '5%'
                  }}
                  transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }}
                  className="w-full bg-[#00ffff]"
                />
              ))}
            </div>
          </motion.div>
        </div>

      </div>

      <footer className="mt-8 text-[8px] font-pixel text-[#ff00ff]/40 tracking-widest">
        TERMINAL_ID: AIS_99_X // ENCRYPTION: ACTIVE
      </footer>
    </div>
  );
}

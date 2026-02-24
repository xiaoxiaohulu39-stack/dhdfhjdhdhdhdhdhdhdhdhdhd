/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Shield, 
  Zap, 
  Target, 
  BatteryCharging, 
  Heart, 
  Gamepad2, 
  Info,
  X,
  ChevronRight,
  Wind,
  Plus,
  Bomb
} from 'lucide-react';
import { 
  GameState, 
  EnemyType, 
  PowerUpType, 
  Player, 
  Bullet, 
  Enemy, 
  PowerUp, 
  Particle,
  Achievement
} from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  PLAYER_SPEED, 
  PLAYER_MAX_LIVES, 
  INVINCIBILITY_DURATION,
  BULLET_SPEED,
  BULLET_SIZE,
  ENEMY_CONFIGS,
  POWERUP_SIZE,
  POWERUP_SPEED,
  POWERUP_DURATION,
  ACHIEVEMENTS_LIST
} from './constants';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(PLAYER_MAX_LIVES);
  const [achievements, setAchievements] = useState<Achievement[]>(
    ACHIEVEMENTS_LIST.map(a => ({ ...a, unlocked: false }))
  );
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState(false);

  // Game state refs for the loop
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    lives: PLAYER_MAX_LIVES,
    maxLives: PLAYER_MAX_LIVES,
    score: 0,
    level: 1,
    invincible: false,
    invincibleTimer: 0,
    powerUps: {
      tripleShot: 0,
      shield: false,
      speedBoost: 0,
    }
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frameCountRef = useRef(0);
  const lastShotTimeRef = useRef(0);

  // Initialize stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  // Initialize stars properly
  if (starsRef.current.length === 0) {
    for (let i = 0; i < 150; i++) {
      starsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
      });
    }
  }

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index !== -1 && !prev[index].unlocked) {
        const newAchievements = [...prev];
        newAchievements[index] = { ...newAchievements[index], unlocked: true };
        setActiveAchievement(newAchievements[index]);
        setTimeout(() => setActiveAchievement(null), 3000);
        return newAchievements;
      }
      return prev;
    });
  }, []);

  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        maxLife: Math.random() * 0.5 + 0.5,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  const spawnEnemy = () => {
    const types = [EnemyType.BASIC];
    if (level >= 2) types.push(EnemyType.FAST);
    if (level >= 3) types.push(EnemyType.HEAVY);

    const type = types[Math.floor(Math.random() * types.length)];
    const config = ENEMY_CONFIGS[type];
    
    enemiesRef.current.push({
      x: Math.random() * (CANVAS_WIDTH - config.width),
      y: -config.height,
      ...config,
      type,
    });
  };

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() > 0.2) return; // 20% chance
    
    const rand = Math.random();
    let type: PowerUpType;
    if (rand < 0.25) type = PowerUpType.TRIPLE_SHOT;
    else if (rand < 0.5) type = PowerUpType.SHIELD;
    else if (rand < 0.7) type = PowerUpType.SPEED_BOOST;
    else if (rand < 0.85) type = PowerUpType.LIFE_UP;
    else type = PowerUpType.CLEAR_SCREEN;

    powerUpsRef.current.push({
      x,
      y,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      speed: POWERUP_SPEED,
      type,
    });
  };

  const resetGame = () => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      lives: PLAYER_MAX_LIVES,
      maxLives: PLAYER_MAX_LIVES,
      score: 0,
      level: 1,
      invincible: false,
      invincibleTimer: 0,
      powerUps: {
        tripleShot: 0,
        shield: false,
        speedBoost: 0,
      }
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setLevel(1);
    setLives(PLAYER_MAX_LIVES);
    setGameState(GameState.PLAYING);
    frameCountRef.current = 0;
  };

  const handleShoot = () => {
    const now = Date.now();
    if (now - lastShotTimeRef.current < 200) return;
    lastShotTimeRef.current = now;

    const p = playerRef.current;
    if (p.powerUps.tripleShot > 0) {
      bulletsRef.current.push(
        { x: p.x + p.width / 2, y: p.y, speed: BULLET_SPEED, angle: -Math.PI / 2, isPlayer: true },
        { x: p.x + p.width / 2, y: p.y, speed: BULLET_SPEED, angle: -Math.PI / 2 - 0.2, isPlayer: true },
        { x: p.x + p.width / 2, y: p.y, speed: BULLET_SPEED, angle: -Math.PI / 2 + 0.2, isPlayer: true }
      );
    } else {
      bulletsRef.current.push({
        x: p.x + p.width / 2, y: p.y, speed: BULLET_SPEED, angle: -Math.PI / 2, isPlayer: true
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'KeyP') {
        setGameState(prev => {
          if (prev === GameState.PLAYING) return GameState.PAUSED;
          if (prev === GameState.PAUSED) return GameState.PLAYING;
          return prev;
        });
      }
      if (e.code === 'Space' && gameState === GameState.PLAYING) {
        handleShoot();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      frameCountRef.current++;
      const p = playerRef.current;

      // Handle Input
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) p.x -= p.speed;
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) p.x += p.speed;
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) p.y -= p.speed;
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) p.y += p.speed;

      // Auto Fire
      handleShoot();

      // Constrain Player
      p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
      p.y = Math.max(0, Math.min(CANVAS_HEIGHT - p.height, p.y));

      // Invincibility
      if (p.invincible) {
        p.invincibleTimer--;
        if (p.invincibleTimer <= 0) p.invincible = false;
      }

      // Power-up duration
      if (p.powerUps.tripleShot > 0) p.powerUps.tripleShot--;
      if (p.powerUps.speedBoost > 0) {
        p.powerUps.speedBoost--;
        p.speed = PLAYER_SPEED * 1.6;
      } else {
        p.speed = PLAYER_SPEED;
      }

      // Spawn Enemies
      const spawnRate = Math.max(20, 60 - level * 5);
      if (frameCountRef.current % spawnRate === 0) {
        spawnEnemy();
      }

      // Update Stars
      starsRef.current.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      });

      // Update Bullets
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        return b.y > -20 && b.y < CANVAS_HEIGHT + 20 && b.x > -20 && b.x < CANVAS_WIDTH + 20;
      });

      // Update Enemies
      enemiesRef.current = enemiesRef.current.filter(e => {
        e.y += e.speed;
        
        // Collision with Player
        if (!p.invincible && 
            e.x < p.x + p.width && e.x + e.width > p.x &&
            e.y < p.y + p.height && e.y + e.height > p.y) {
          
          if (p.powerUps.shield) {
            p.powerUps.shield = false;
            p.invincible = true;
            p.invincibleTimer = INVINCIBILITY_DURATION;
            createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
            return false;
          } else {
            p.lives--;
            setLives(p.lives);
            p.invincible = true;
            p.invincibleTimer = INVINCIBILITY_DURATION;
            createExplosion(p.x + p.width / 2, p.y + p.height / 2, '#ffffff', 30);
            if (p.lives <= 0) {
              setGameState(GameState.GAME_OVER);
            }
          }
        }

        // Escape Penalty
        if (e.y > CANVAS_HEIGHT) {
          setScore(prev => Math.max(0, prev - 50));
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 1000);
          return false;
        }
        return true;
      });

      // Update Power-ups
      powerUpsRef.current = powerUpsRef.current.filter(pu => {
        pu.y += pu.speed;
        
        // Collision with Player
        if (pu.x < p.x + p.width && pu.x + pu.width > p.x &&
            pu.y < p.y + p.height && pu.y + pu.height > p.y) {
          if (pu.type === PowerUpType.TRIPLE_SHOT) {
            p.powerUps.tripleShot = POWERUP_DURATION;
          } else if (pu.type === PowerUpType.SHIELD) {
            p.powerUps.shield = true;
          } else if (pu.type === PowerUpType.SPEED_BOOST) {
            p.powerUps.speedBoost = POWERUP_DURATION;
          } else if (pu.type === PowerUpType.LIFE_UP) {
            p.lives = Math.min(p.lives + 1, p.maxLives);
            setLives(p.lives);
          } else if (pu.type === PowerUpType.CLEAR_SCREEN) {
            enemiesRef.current.forEach(e => {
              createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
              setScore(prev => prev + Math.floor(e.points / 2));
            });
            enemiesRef.current = [];
          }
          
          // Achievement: Power Hungry
          if (p.powerUps.tripleShot > 0 && p.powerUps.shield) {
            unlockAchievement('power_hungry');
          }
          
          return false;
        }
        return pu.y < CANVAS_HEIGHT;
      });

      // Bullet-Enemy Collision
      bulletsRef.current = bulletsRef.current.filter(b => {
        let hit = false;
        enemiesRef.current = enemiesRef.current.filter(e => {
          if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
            e.health--;
            hit = true;
            if (e.health <= 0) {
              createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
              spawnPowerUp(e.x + e.width / 2, e.y + e.height / 2);
              setScore(prev => {
                const newScore = prev + e.points;
                // Achievements
                if (newScore >= 100) unlockAchievement('first_blood');
                if (newScore >= 5000) unlockAchievement('sharpshooter');
                if (newScore >= 15000) unlockAchievement('ace_pilot');
                
                // Level Up
                const nextLevel = Math.floor(newScore / 500) + 1;
                if (nextLevel > level) {
                  setLevel(nextLevel);
                  setLevelUpMessage(true);
                  setTimeout(() => setLevelUpMessage(false), 2000);
                  enemiesRef.current = []; // Clear screen
                  if (nextLevel === 5) unlockAchievement('survivor');
                }
                return newScore;
              });
              return false;
            }
          }
          return true;
        });
        return !hit;
      });

      // Update Particles
      particlesRef.current = particlesRef.current.filter(part => {
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;
        return part.life > 0;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Stars
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.speed / 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Particles
      particlesRef.current.forEach(part => {
        ctx.globalAlpha = part.life;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Player
      const p = playerRef.current;
      if (!p.invincible || frameCountRef.current % 10 < 5) {
        // Body
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x + p.width, p.y + p.height);
        ctx.lineTo(p.x + p.width / 2, p.y + p.height * 0.8);
        ctx.lineTo(p.x, p.y + p.height);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height * 0.4, p.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield
        if (p.powerUps.shield) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 0.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.shadowBlur = 0;
      }

      // Draw Bullets
      ctx.fillStyle = '#fde047';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fde047';
      bulletsRef.current.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Enemies
      enemiesRef.current.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        
        if (e.type === EnemyType.BASIC) {
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === EnemyType.FAST) {
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y + e.height * 0.2);
          ctx.lineTo(e.x + e.width / 2, e.y);
          ctx.lineTo(e.x, e.y + e.height * 0.2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(e.x, e.y, e.width, e.height);
          // Health bar for heavy
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(e.x, e.y - 10, e.width * (e.health / e.maxHealth), 4);
        }
      });
      ctx.shadowBlur = 0;

      // Draw Power-ups
      powerUpsRef.current.forEach(pu => {
        ctx.shadowBlur = 15;
        let color = '#fde047';
        let label = 'T';
        
        switch(pu.type) {
          case PowerUpType.TRIPLE_SHOT: color = '#fde047'; label = 'T'; break;
          case PowerUpType.SHIELD: color = '#10b981'; label = 'S'; break;
          case PowerUpType.SPEED_BOOST: color = '#3b82f6'; label = 'B'; break;
          case PowerUpType.LIFE_UP: color = '#ef4444'; label = 'L'; break;
          case PowerUpType.CLEAR_SCREEN: color = '#a855f7'; label = 'C'; break;
        }

        ctx.shadowColor = color;
        ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, pu.x + pu.width / 2, pu.y + pu.height / 2 + 4);
      });
      ctx.shadowBlur = 0;
    };

    const render = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, level]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      case 'BatteryCharging': return <BatteryCharging className="w-6 h-6" />;
      case 'Trophy': return <Trophy className="w-6 h-6" />;
      case 'Wind': return <Wind className="w-6 h-6" />;
      case 'Plus': return <Plus className="w-6 h-6" />;
      case 'Bomb': return <Bomb className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start relative z-10">
        
        {/* Main Game Area */}
        <div className="relative aspect-[4/3] w-full max-w-[800px] mx-auto glass-panel overflow-hidden neon-border">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />

          {/* HUD Overlay */}
          {gameState === GameState.PLAYING && (
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col gap-2">
                <div className="glass-panel px-4 py-2 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(PLAYER_MAX_LIVES)].map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-5 h-5 ${i < lives ? 'fill-red-500 text-red-500' : 'text-white/20'}`} 
                      />
                    ))}
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="text-xl font-bold tracking-wider neon-text">{score.toLocaleString()}</div>
                </div>
                <div className="glass-panel px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                  Level {level}
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => setGameState(GameState.PAUSED)}
                  className="glass-button p-2 pointer-events-auto"
                >
                  <Pause className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {playerRef.current.powerUps.tripleShot > 0 && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="glass-panel px-3 py-1 flex items-center gap-2 text-yellow-400 text-xs font-bold"
                    >
                      <Zap className="w-4 h-4" /> TRIPLE SHOT
                    </motion.div>
                  )}
                  {playerRef.current.powerUps.shield && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="glass-panel px-3 py-1 flex items-center gap-2 text-emerald-400 text-xs font-bold"
                    >
                      <Shield className="w-4 h-4" /> SHIELD ACTIVE
                    </motion.div>
                  )}
                  {playerRef.current.powerUps.speedBoost > 0 && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="glass-panel px-3 py-1 flex items-center gap-2 text-blue-400 text-xs font-bold"
                    >
                      <Wind className="w-4 h-4" /> SPEED BOOST
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <AnimatePresence>
            {showWarning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-black text-4xl italic tracking-tighter pointer-events-none z-50"
                style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.8)' }}
              >
                ENEMY ESCAPED! -50
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level Up Message */}
          <AnimatePresence>
            {levelUpMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 font-black text-6xl italic tracking-tighter pointer-events-none z-50 text-center"
                style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.8)' }}
              >
                LEVEL UP!<br/>
                <span className="text-2xl not-italic tracking-widest uppercase opacity-80">Difficulty Increased</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievement Toast */}
          <AnimatePresence>
            {activeAchievement && (
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 glass-panel p-4 flex items-center gap-4 border-yellow-500/50 min-w-[300px] z-[100]"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  {renderIcon(activeAchievement.icon)}
                </div>
                <div>
                  <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest">成就解锁!</div>
                  <div className="font-bold text-lg">{activeAchievement.name}</div>
                  <div className="text-sm text-white/60">{activeAchievement.description}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screens */}
          <AnimatePresence mode="wait">
            {gameState === GameState.START && (
              <motion.div 
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-8 text-center"
              >
                <motion.div 
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="mb-8"
                >
                  <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 mb-2">
                    TINA星际先锋
                  </h1>
                  <div className="text-blue-400/60 uppercase tracking-[0.5em] text-sm font-bold">Interstellar Pioneer</div>
                </motion.div>

                <div className="max-w-md mb-12 text-white/70 leading-relaxed">
                  穿越浩瀚星空，击退来袭的敌机。收集能量道具，解锁传奇成就，成为最顶尖的星际飞行员。
                </div>

                <button 
                  onClick={resetGame}
                  className="glass-button px-12 py-4 text-xl font-bold bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/40 group"
                >
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  开始游戏
                </button>
                
                <div className="mt-12 grid grid-cols-3 gap-8 text-white/40 text-xs uppercase tracking-widest font-bold">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">W/A/S/D</div>
                    移动
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">SPACE</div>
                    射击
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">P</div>
                    暂停
                  </div>
                </div>
              </motion.div>
            )}

            {gameState === GameState.PAUSED && (
              <motion.div 
                key="paused"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md z-50"
              >
                <h2 className="text-5xl font-black italic tracking-tighter mb-12">游戏暂停</h2>
                <div className="flex flex-col gap-4 w-64">
                  <button 
                    onClick={() => setGameState(GameState.PLAYING)}
                    className="glass-button w-full py-4 text-lg"
                  >
                    <Play className="w-5 h-5" /> 继续游戏
                  </button>
                  <button 
                    onClick={() => setGameState(GameState.START)}
                    className="glass-button w-full py-4 text-lg text-white/60"
                  >
                    <X className="w-5 h-5" /> 退出游戏
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === GameState.GAME_OVER && (
              <motion.div 
                key="gameover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg p-8 text-center z-[200]"
              >
                <div className="text-red-500 font-black text-7xl italic tracking-tighter mb-4" style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}>
                  GAME OVER
                </div>
                
                <div className="glass-panel p-8 mb-8 w-full max-w-md">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/40 mb-1">最终得分</div>
                      <div className="text-4xl font-bold text-blue-400">{score.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/40 mb-1">最高关卡</div>
                      <div className="text-4xl font-bold text-blue-400">{level}</div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-xs uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                      <Trophy className="w-3 h-3" /> 已解锁成就
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {achievements.filter(a => a.unlocked).length > 0 ? (
                        achievements.filter(a => a.unlocked).map(a => (
                          <div key={a.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold text-yellow-500">
                            {renderIcon(a.icon)} {a.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-white/20 italic text-sm">暂无成就</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={resetGame}
                    className="glass-button px-10 py-4 bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/40"
                  >
                    <RotateCcw className="w-5 h-5" /> 再次挑战
                  </button>
                  <button 
                    onClick={() => setGameState(GameState.START)}
                    className="glass-button px-10 py-4"
                  >
                    <X className="w-5 h-5" /> 返回主菜单
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-blue-400" /> 操作指南
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">移动战机</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded">W A S D / 方向键</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">发射子弹</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded">SPACE</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">暂停游戏</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded">P</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BatteryCharging className="w-5 h-5 text-yellow-400" /> 能量道具
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">三向子弹 (T)</div>
                  <div className="text-xs text-white/50">大幅增强火力，持续10秒。</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">能量护盾 (S)</div>
                  <div className="text-xs text-white/50">抵挡一次攻击，不限时间。</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">极速引擎 (B)</div>
                  <div className="text-xs text-white/50">提升战机移动速度，持续10秒。</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">额外生命 (L)</div>
                  <div className="text-xs text-white/50">立即恢复一点生命值。</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                  <Bomb className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">星际炸弹 (C)</div>
                  <div className="text-xs text-white/50">清除屏幕上所有敌机。</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" /> 成就系统
            </h3>
            <div className="space-y-3">
              {achievements.map(a => (
                <div key={a.id} className={`flex items-center gap-3 transition-opacity ${a.unlocked ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.unlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white/40'}`}>
                    {renderIcon(a.icon)}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">{a.name}</div>
                    <div className="text-[10px] text-white/60">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Controls (Only visible on touch devices) */}
      <div className="fixed bottom-8 left-0 w-full px-8 flex justify-between items-end lg:hidden pointer-events-none z-50">
        <div className="grid grid-cols-3 gap-2 pointer-events-auto">
          <div />
          <button 
            className="w-16 h-16 glass-panel flex items-center justify-center active:bg-white/20"
            onTouchStart={() => keysRef.current.add('ArrowUp')}
            onTouchEnd={() => keysRef.current.delete('ArrowUp')}
          >
            <ChevronRight className="w-8 h-8 -rotate-90" />
          </button>
          <div />
          <button 
            className="w-16 h-16 glass-panel flex items-center justify-center active:bg-white/20"
            onTouchStart={() => keysRef.current.add('ArrowLeft')}
            onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
          >
            <ChevronRight className="w-8 h-8 rotate-180" />
          </button>
          <button 
            className="w-16 h-16 glass-panel flex items-center justify-center active:bg-white/20"
            onTouchStart={() => keysRef.current.add('ArrowDown')}
            onTouchEnd={() => keysRef.current.delete('ArrowDown')}
          >
            <ChevronRight className="w-8 h-8 rotate-90" />
          </button>
          <button 
            className="w-16 h-16 glass-panel flex items-center justify-center active:bg-white/20"
            onTouchStart={() => keysRef.current.add('ArrowRight')}
            onTouchEnd={() => keysRef.current.delete('ArrowRight')}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        <button 
          className="w-24 h-24 rounded-full glass-panel flex items-center justify-center border-blue-500/50 pointer-events-auto active:scale-90 transition-transform"
          onTouchStart={handleShoot}
        >
          <Target className="w-10 h-10 text-blue-400" />
        </button>
      </div>
    </div>
  );
}

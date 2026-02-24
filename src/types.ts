export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  HEAVY = 'HEAVY',
}

export enum PowerUpType {
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  SHIELD = 'SHIELD',
  SPEED_BOOST = 'SPEED_BOOST',
  LIFE_UP = 'LIFE_UP',
  CLEAR_SCREEN = 'CLEAR_SCREEN',
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  speed: number;
}

export interface Player extends Entity {
  lives: number;
  maxLives: number;
  score: number;
  level: number;
  invincible: boolean;
  invincibleTimer: number;
  powerUps: {
    tripleShot: number; // duration in frames or ms
    shield: boolean;
    speedBoost: number;
  };
}

export interface Bullet extends Point {
  speed: number;
  angle: number;
  isPlayer: boolean;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  color: string;
  points: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

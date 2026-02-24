export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 40;
export const PLAYER_SPEED = 5;
export const PLAYER_MAX_LIVES = 3;
export const INVINCIBILITY_DURATION = 120; // frames

export const BULLET_SPEED = 7;
export const BULLET_SIZE = 4;

export const ENEMY_CONFIGS = {
  BASIC: {
    width: 35,
    height: 35,
    speed: 2,
    health: 1,
    points: 100,
    color: '#3b82f6', // blue-500
  },
  FAST: {
    width: 25,
    height: 25,
    speed: 4,
    health: 1,
    points: 150,
    color: '#10b981', // emerald-500
  },
  HEAVY: {
    width: 50,
    height: 50,
    speed: 1,
    health: 3,
    points: 300,
    color: '#ef4444', // red-500
  },
};

export const POWERUP_SIZE = 30;
export const POWERUP_SPEED = 1.5;
export const POWERUP_DURATION = 600; // 10 seconds at 60fps

export const ACHIEVEMENTS_LIST = [
  {
    id: 'first_blood',
    name: '第一滴血',
    description: '击落第一架敌机',
    icon: 'Target',
  },
  {
    id: 'survivor',
    name: '生存者',
    description: '达到第5关',
    icon: 'Shield',
  },
  {
    id: 'sharpshooter',
    name: '神枪手',
    description: '分数达到5000分',
    icon: 'Zap',
  },
  {
    id: 'power_hungry',
    name: '能量狂人',
    description: '同时拥有护盾和三向子弹',
    icon: 'BatteryCharging',
  },
  {
    id: 'ace_pilot',
    name: '王牌飞行员',
    description: '分数达到15000分',
    icon: 'Trophy',
  },
];

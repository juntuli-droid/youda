import fs from 'fs';
import path from 'path';

export interface Career {
  id: string;
  gameName: string;
  hours: number;
  rank: string;
}

export interface Vlog {
  id: string;
  title: string;
  gameName: string;
  videoUrl?: string;
  coverUrl?: string;
  content?: string; // New field for text-based logs
  type: 'video' | 'log'; // Differentiate between video and pure log
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  nickname?: string;
  avatarUrl?: string;
  badges?: string[]; // IDs of unlocked and active badges
  unlockedBadges?: string[]; // IDs of all unlocked badges
  careers?: Career[];
  vlogs?: Vlog[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Initialize the data file if it doesn't exist
const initDb = () => {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
};

export const getUsers = (): User[] => {
  initDb();
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

export const saveUsers = (users: User[]) => {
  initDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.email === email);
};

export const findUserByUsername = (username: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.username === username);
};

export const createUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
};

export const updateUser = (id: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
  }
  return null;
};

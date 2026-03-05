import fs from 'fs';
import path from 'path';

const EPISODES_FILE = path.join(process.cwd(), 'data', 'episodes.json');
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(EPISODES_FILE))) {
  fs.mkdirSync(path.dirname(EPISODES_FILE), { recursive: true });
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration: string;
  fileSize: number;
}

export interface Settings {
  podcastName: string;
  podcastDescription: string;
  podcastAuthor: string;
  podcastCoverUrl: string;
  podcastCategory: string;
  podcastLanguage: string;
}

export async function getEpisodes(): Promise<Episode[]> {
  try {
    if (!fs.existsSync(EPISODES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(EPISODES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveEpisodes(episodes: Episode[]): Promise<void> {
  fs.writeFileSync(EPISODES_FILE, JSON.stringify(episodes, null, 2));
}

export async function getSettings(): Promise<Settings> {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      const defaultSettings: Settings = {
        podcastName: "My Podcast",
        podcastDescription: "An automated podcast",
        podcastAuthor: "Podcast Creator",
        podcastCoverUrl: "",
        podcastCategory: "Technology",
        podcastLanguage: "en-us"
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    const defaultSettings: Settings = {
      podcastName: "My Podcast",
      podcastDescription: "An automated podcast",
      podcastAuthor: "Podcast Creator",
      podcastCoverUrl: "",
      podcastCategory: "Technology",
      podcastLanguage: "en-us"
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

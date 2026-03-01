export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "speed" | "accuracy" | "dedication" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Speed
  { id: "first_test", name: "First Keystroke", description: "Complete your first typing test", icon: "⌨️", category: "dedication", rarity: "common" },
  { id: "speed_30", name: "Getting Started", description: "Reach 30 WPM", icon: "🐢", category: "speed", rarity: "common" },
  { id: "speed_50", name: "Speed Demon", description: "Reach 50 WPM", icon: "🚀", category: "speed", rarity: "common" },
  { id: "speed_75", name: "Keyboard Warrior", description: "Reach 75 WPM", icon: "⚡", category: "speed", rarity: "rare" },
  { id: "speed_100", name: "Century Typer", description: "Reach 100 WPM", icon: "💯", category: "speed", rarity: "epic" },
  { id: "speed_120", name: "Flash Fingers", description: "Reach 120 WPM", icon: "🌩️", category: "speed", rarity: "epic" },
  { id: "speed_150", name: "Transcendent", description: "Reach 150 WPM", icon: "🔥", category: "speed", rarity: "legendary" },
  // Accuracy
  { id: "acc_95", name: "Precise", description: "Achieve 95%+ accuracy", icon: "🎯", category: "accuracy", rarity: "common" },
  { id: "acc_99", name: "Almost Perfect", description: "Achieve 99%+ accuracy", icon: "✨", category: "accuracy", rarity: "rare" },
  { id: "perfect_acc", name: "Perfection", description: "Achieve 100% accuracy", icon: "💎", category: "accuracy", rarity: "epic" },
  // Dedication
  { id: "tests_5", name: "Warming Up", description: "Complete 5 typing tests", icon: "🌱", category: "dedication", rarity: "common" },
  { id: "tests_10", name: "Dedicated", description: "Complete 10 typing tests", icon: "💪", category: "dedication", rarity: "common" },
  { id: "tests_25", name: "Committed", description: "Complete 25 typing tests", icon: "🏋️", category: "dedication", rarity: "rare" },
  { id: "tests_50", name: "Veteran", description: "Complete 50 typing tests", icon: "🥇", category: "dedication", rarity: "epic" },
  { id: "tests_100", name: "Legend", description: "Complete 100 typing tests", icon: "👑", category: "dedication", rarity: "legendary" },
  // Special
  { id: "early_bird", name: "Early Bird", description: "Complete a test between 5–8 AM", icon: "🌅", category: "special", rarity: "rare" },
  { id: "night_owl", name: "Night Owl", description: "Complete a test between 12–4 AM", icon: "🦉", category: "special", rarity: "rare" },
  { id: "speed_acc_combo", name: "The Complete Package", description: "Achieve 80+ WPM with 99%+ accuracy", icon: "👌", category: "special", rarity: "legendary" },
  { id: "top_10", name: "Elite", description: "Reach global top 10", icon: "🎖️", category: "special", rarity: "legendary" },
  { id: "top_1", name: "The Best", description: "Reach #1 globally", icon: "🏆", category: "special", rarity: "legendary" },
];

export interface TestResult {
  wpm: number;
  accuracy: number;
  totalTests: number;
  unlockedAchievements: string[];
}

export function checkAchievements(result: TestResult, hour: number): string[] {
  const newUnlocks: string[] = [];
  const unlocked = new Set(result.unlockedAchievements);

  const check = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) newUnlocks.push(id);
  };

  check("first_test", result.totalTests >= 1);
  check("speed_30", result.wpm >= 30);
  check("speed_50", result.wpm >= 50);
  check("speed_75", result.wpm >= 75);
  check("speed_100", result.wpm >= 100);
  check("speed_120", result.wpm >= 120);
  check("speed_150", result.wpm >= 150);
  check("acc_95", result.accuracy >= 95);
  check("acc_99", result.accuracy >= 99);
  check("perfect_acc", result.accuracy >= 100);
  check("tests_5", result.totalTests >= 5);
  check("tests_10", result.totalTests >= 10);
  check("tests_25", result.totalTests >= 25);
  check("tests_50", result.totalTests >= 50);
  check("tests_100", result.totalTests >= 100);
  check("early_bird", hour >= 5 && hour < 8);
  check("night_owl", hour >= 0 && hour < 4);
  check("speed_acc_combo", result.wpm >= 80 && result.accuracy >= 99);

  return newUnlocks;
}

export const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400 border-gray-600",
  rare: "text-blue-400 border-blue-600",
  epic: "text-purple-400 border-purple-600",
  legendary: "text-yellow-400 border-yellow-500",
};

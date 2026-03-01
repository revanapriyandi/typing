export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "speed" | "accuracy" | "dedication" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Speed — thresholds raised significantly
  { id: "first_test",  name: "First Keystroke",      description: "Complete your first typing test",        icon: "⌨️", category: "dedication", rarity: "common" },
  { id: "speed_40",   name: "Getting Warmed Up",     description: "Reach 40 WPM",                          icon: "🐢", category: "speed",      rarity: "common" },
  { id: "speed_60",   name: "Typing", description: "Reach 60 WPM",                          icon: "🚶", category: "speed",      rarity: "common" },
  { id: "speed_80",   name: "Above Average",         description: "Reach 80 WPM",                          icon: "⚡", category: "speed",      rarity: "rare" },
  { id: "speed_100",  name: "Century Typer",         description: "Reach 100 WPM",                         icon: "💯", category: "speed",      rarity: "rare" },
  { id: "speed_120",  name: "Speed Demon",           description: "Reach 120 WPM",                         icon: "🔥", category: "speed",      rarity: "epic" },
  { id: "speed_140",  name: "Flash Fingers",         description: "Reach 140 WPM",                         icon: "🌩️", category: "speed",      rarity: "epic" },
  { id: "speed_160",  name: "Grandmaster",           description: "Reach 160 WPM",                         icon: "👑", category: "speed",      rarity: "legendary" },

  // Accuracy — much harder: 97, 99, 100 with WPM gate
  { id: "acc_97",         name: "Sharp Shooter",     description: "Achieve 97%+ accuracy",                                 icon: "🎯", category: "accuracy", rarity: "common" },
  { id: "acc_99",         name: "Almost Perfect",    description: "Achieve 99%+ accuracy",                                 icon: "✨", category: "accuracy", rarity: "rare" },
  { id: "perfect_acc",    name: "Flawless",          description: "Achieve 100% accuracy on a 60s+ test",                  icon: "💎", category: "accuracy", rarity: "epic" },

  // Dedication — milestones spaced further apart
  { id: "tests_10",   name: "Warming Up",            description: "Complete 10 typing tests",               icon: "🌱", category: "dedication", rarity: "common" },
  { id: "tests_25",   name: "Regular",               description: "Complete 25 typing tests",               icon: "💪", category: "dedication", rarity: "common" },
  { id: "tests_50",   name: "Dedicated",             description: "Complete 50 typing tests",               icon: "🏋️", category: "dedication", rarity: "rare" },
  { id: "tests_100",  name: "Committed",             description: "Complete 100 typing tests",              icon: "🥇", category: "dedication", rarity: "epic" },
  { id: "tests_250",  name: "Veteran",               description: "Complete 250 typing tests",              icon: "🎖️", category: "dedication", rarity: "legendary" },

  // Special — harder combos
  { id: "early_bird",       name: "Early Bird",         description: "Complete a test between 5–7 AM",                        icon: "🌅", category: "special", rarity: "rare" },
  { id: "night_owl",        name: "Night Owl",          description: "Complete a test between 1–4 AM",                        icon: "🦉", category: "special", rarity: "rare" },
  { id: "speed_acc_combo",  name: "The Complete Package", description: "Achieve 100+ WPM with 99%+ accuracy",                 icon: "👌", category: "special", rarity: "legendary" },
  { id: "top_10",           name: "Elite",              description: "Reach global top 10%",                                  icon: "🏆", category: "special", rarity: "epic" },
  { id: "top_1",            name: "The Best",           description: "Reach global top 1%",                                   icon: "🥇", category: "special", rarity: "legendary" },
];

export interface TestResult {
  wpm: number;
  accuracy: number;
  totalTests: number;
  unlockedAchievements: string[];
  duration?: number; // used for 'perfect_acc' gate
}

export function checkAchievements(result: TestResult, hour: number): string[] {
  const newUnlocks: string[] = [];
  const unlocked = new Set(result.unlockedAchievements);

  const check = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) newUnlocks.push(id);
  };

  // Dedication — first test
  check("first_test", result.totalTests >= 1);

  // Speed gates (raised)
  check("speed_40",  result.wpm >= 40);
  check("speed_60",  result.wpm >= 60);
  check("speed_80",  result.wpm >= 80);
  check("speed_100", result.wpm >= 100);
  check("speed_120", result.wpm >= 120);
  check("speed_140", result.wpm >= 140);
  check("speed_160", result.wpm >= 160);

  // Accuracy gates (raised)
  check("acc_97",      result.accuracy >= 97);
  check("acc_99",      result.accuracy >= 99);
  // Perfect accuracy only counts on 60s+ tests (duration gate)
  check("perfect_acc", result.accuracy >= 100 && (result.duration ?? 0) >= 60);

  // Test count milestones (harder)
  check("tests_10",  result.totalTests >= 10);
  check("tests_25",  result.totalTests >= 25);
  check("tests_50",  result.totalTests >= 50);
  check("tests_100", result.totalTests >= 100);
  check("tests_250", result.totalTests >= 250);

  // Time-of-day specials (tighter windows)
  check("early_bird", hour >= 5 && hour < 7);
  check("night_owl",  hour >= 1 && hour < 4);

  // Combo (harder: 100 WPM + 99% accuracy)
  check("speed_acc_combo", result.wpm >= 100 && result.accuracy >= 99);

  return newUnlocks;
}

export const RARITY_COLORS: Record<string, string> = {
  common:    "text-gray-400 border-gray-600",
  rare:      "text-blue-400 border-blue-600",
  epic:      "text-purple-400 border-purple-600",
  legendary: "text-yellow-400 border-yellow-500",
};

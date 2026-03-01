const ENGLISH_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what", "so",
  "up", "out", "if", "about", "who", "get", "which", "go", "me", "when",
  "make", "can", "like", "time", "no", "just", "him", "know", "take", "people",
  "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
  "then", "now", "look", "only", "come", "its", "over", "think", "also", "back",
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us", "great",
  "between", "need", "large", "often", "hand", "high", "place", "hold", "down", "side",
  "provide", "keep", "children", "begin", "got", "walk", "example", "ease", "paper", "group",
  "always", "music", "those", "both", "mark", "book", "letter", "until", "mile", "river",
  "car", "feet", "care", "second", "enough", "plain", "girl", "usual", "young", "ready",
  "above", "ever", "red", "list", "though", "feel", "talk", "bird", "soon", "body",
  "dog", "family", "direct", "pose", "leave", "song", "measure", "door", "product", "black",
  "short", "numeral", "class", "wind", "question", "happen", "complete", "ship", "area", "half",
  "rock", "order", "fire", "south", "problem", "piece", "told", "knew", "pass", "since",
  "top", "whole", "king", "space", "heard", "best", "hour", "better", "true", "during",
  "hundred", "five", "remember", "step", "early", "hold", "west", "ground", "interest", "reach",
];

const INDONESIAN_WORDS = [
  "yang", "dan", "di", "itu", "dengan", "tidak", "ini", "dari", "dalam", "akan",
  "ada", "juga", "pada", "ke", "saya", "kita", "mereka", "untuk", "adalah", "sudah",
  "oleh", "atau", "bisa", "kami", "sebagai", "telah", "lebih", "ia", "apa", "dia",
  "tahun", "dapat", "atas", "karena", "hanya", "lain", "menjadi", "orang", "pun", "kali",
  "belum", "bila", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
  "besar", "kecil", "banyak", "sedikit", "baik", "buruk", "baru", "lama", "tinggi", "rendah",
  "cepat", "lambat", "panjang", "pendek", "lebar", "sempit", "tebal", "tipis", "berat", "ringan",
  "hidup", "mati", "pergi", "datang", "kerja", "tidur", "makan", "minum", "baca", "tulis",
  "jalan", "lari", "duduk", "berdiri", "berbicara", "mendengar", "melihat", "merasakan", "berpikir", "bergerak",
  "hari", "waktu", "malam", "siang", "pagi", "sore", "jam", "menit", "detik", "bulan",
  "rumah", "sekolah", "kantor", "pasar", "toko", "hotel", "bandara", "stasiun", "jalan", "kota",
  "buku", "kertas", "pena", "meja", "kursi", "pintu", "jendela", "lantai", "atap", "dinding",
  "teman", "keluarga", "anak", "ibu", "ayah", "kakak", "adik", "paman", "bibi", "nenek",
  "indonesia", "dunia", "negara", "kota", "desa", "pulau", "laut", "gunung", "sungai", "danau",
  "makanan", "minuman", "nasi", "ayam", "ikan", "sayuran", "buah", "roti", "susu", "air",
  "komputer", "telepon", "internet", "program", "aplikasi", "sistem", "data", "informasi", "teknologi", "digital",
];

const SPANISH_WORDS = [
  "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
  "las", "un", "por", "con", "no", "una", "su", "para", "es", "al",
  "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este", "sí",
  "porque", "esta", "entre", "cuando", "muy", "sin", "sobre", "también", "me", "hasta",
  "hay", "donde", "quien", "desde", "todo", "nos", "dos", "cuando", "muy", "tiempo",
  "bien", "tener", "años", "vez", "sido", "gran", "ni", "hacer", "estado", "puede",
  "qué", "sólo", "vida", "ahora", "algo", "ver", "así", "esto", "parte", "gobierno",
  "como", "año", "solo", "caso", "nada", "poder", "día", "uno", "días", "mismo",
  "trabajo", "si", "lugar", "tres", "pueblo", "hoy", "forma", "gente", "menos", "mundo",
  "eso", "antes", "después", "hombre", "poder", "país", "siempre", "decir", "mejor", "entonces",
];

const FRENCH_WORDS = [
  "le", "de", "un", "à", "être", "et", "en", "avoir", "que", "pour",
  "dans", "ce", "il", "qui", "ne", "sur", "se", "pas", "plus", "pouvoir",
  "par", "je", "avec", "tout", "faire", "son", "mettre", "autre", "on", "mais",
  "nous", "comme", "ou", "si", "leur", "y", "dire", "elle", "devoir", "avant",
  "deux", "même", "prendre", "aussi", "celui", "donner", "bien", "où", "fois", "vous",
  "encore", "nouveau", "aller", "cela", "entre", "premier", "vouloir", "déjà", "grand", "mon",
  "me", "moins", "quelque", "lui", "temps", "très", "savoir", "falloir", "voir", "notre",
  "sans", "dont", "raison", "monde", "non", "monsieur", "quand", "ton", "jour", "homme",
  "trouver", "peu", "soit", "faire", "enfant", "chose", "nouveau", "parler", "prendre", "pays",
  "plusieurs", "partie", "toujours", "vie", "beaucoup", "rien", "pendant", "heure", "peu", "comment",
];

const GERMAN_WORDS = [
  "der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich",
  "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als",
  "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach",
  "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über",
  "einen", "so", "zum", "war", "haben", "nur", "oder", "aber", "vor", "zur",
  "bis", "mehr", "durch", "man", "sein", "wurde", "sei", "prozent", "hatte", "kann",
  "gegen", "vom", "können", "schon", "wenn", "habe", "seine", "ihre", "und", "dies",
  "ihr", "wir", "unter", "ich", "mich", "dann", "seiner", "solche", "diese", "sagen",
  "nun", "da", "seinen", "machen", "keine", "uns", "muss", "zeit", "jahr", "wie",
  "weil", "diesen", "ihren", "würde", "geben", "zwei", "sehr", "damit", "machen", "gehen",
];

const CODING_SNIPPETS = [
  "function calculateWpm(correctChars, timeMins) {\n  return Math.round((correctChars / 5) / timeMins);\n}",
  "import { useState, useEffect } from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}",
  "for (let i = 0; i < array.length; i++) {\n  console.log(array[i]);\n}",
  "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "const [data, setData] = useState(null);\nuseEffect(() => {\n  fetch('/api/data').then(res => res.json()).then(setData);\n}, []);",
  "interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nconst user: User = { id: '1', name: 'John Doe', email: 'john@example.com' };",
  "CREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);",
  "class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    console.log(`${this.name} makes a noise.`);\n  }\n}"
];

export type Language = "english" | "indonesian" | "spanish" | "french" | "german" | "coding" | "custom";

const POOLS: Partial<Record<Language, string[]>> = {
  english: ENGLISH_WORDS,
  indonesian: INDONESIAN_WORDS,
  spanish: SPANISH_WORDS,
  french: FRENCH_WORDS,
  german: GERMAN_WORDS,
};

export function generateWords(language: Language, count: number): string {
  const pool = POOLS[language] || ENGLISH_WORDS;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words.join(" ");
}

export function generateParagraph(language: Language, wordCount: number = 60, customText: string = ""): string {
  if (language === "custom") return customText || "You have selected Custom mode. Please enter your text to begin.";
  if (language === "coding") {
    // For coding, we ignore exact word count and pick random snippets based on requested length loosely
    const snips = [];
    const snipCount = wordCount < 30 ? 1 : 2;
    for (let i = 0; i < snipCount; i++) {
        snips.push(CODING_SNIPPETS[Math.floor(Math.random() * CODING_SNIPPETS.length)]);
    }
    return snips.join("\n\n");
  }
  return generateWords(language, wordCount);
}

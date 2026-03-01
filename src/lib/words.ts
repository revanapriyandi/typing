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

export type Language = "english" | "indonesian" | "spanish" | "french" | "german";

const POOLS: Record<Language, string[]> = {
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

export function generateParagraph(language: Language, wordCount: number = 60): string {
  return generateWords(language, wordCount);
}

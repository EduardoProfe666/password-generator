export const ENGLISH_WORDS = [
  "love",
  "star",
  "rock",
  "blue",
  "dragon",
  "red",
  "black",
  "angel",
  // ...existing words...
] as const;

export const SPANISH_WORDS = [
  "agua",
  "aire",
  "alma",
  "amigo",
  "amor",
  "angel",
  "arbol",
  "arena",
  // ...existing words...
] as const;

export const WORDS_BY_LANGUAGE = {
  en: ENGLISH_WORDS,
  es: SPANISH_WORDS,
} as const;

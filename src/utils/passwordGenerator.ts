import { PasswordOptions } from "../types";
import {
  LOWERCASE_CHARS,
  UPPERCASE_CHARS,
  NUMBER_CHARS,
  SYMBOL_CHARS,
  AMBIGUOUS_CHARS,
} from "../constants/characterSets";
import { WORDS_BY_LANGUAGE } from "../constants/wordLists";
import { getRandomNumber, getRandomNumbers } from "./cryptoUtils";

export function generatePassword(options: PasswordOptions): string {
  let chars = "";
  if (options.includeLowercase) chars += LOWERCASE_CHARS;
  if (options.includeUppercase) chars += UPPERCASE_CHARS;
  if (options.includeNumbers) chars += NUMBER_CHARS;
  if (options.includeSymbols) chars += SYMBOL_CHARS;
  if (options.excludeAmbiguous) {
    chars = chars
      .split("")
      .filter((char) => !AMBIGUOUS_CHARS.includes(char))
      .join("");
  }

  if (chars.length === 0) {
    throw new Error("At least one character set must be selected");
  }

  let password = "";
  const cryptoValues = getRandomNumbers(options.length);
  for (let i = 0; i < options.length; i++) {
    password += chars[cryptoValues[i] % chars.length];
  }
  return password;
}

export function generateWordBasedPassword(options: PasswordOptions): string {
  const wordList = WORDS_BY_LANGUAGE[options.language];

  const capitalizeFirstLetter = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const words = Array.from({ length: options.wordCount }, () =>
    capitalizeFirstLetter(wordList[getRandomNumber(wordList.length)])
  );

  if (options.includeNumbers) {
    words.push((getRandomNumber(900) + 100).toString());
  }

  return words.join(options.wordSeparator);
}

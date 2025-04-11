export function getRandomNumber(max: number): number {
  const cryptoValue = new Uint32Array(1);
  crypto.getRandomValues(cryptoValue);
  return cryptoValue[0] % max;
}

export function getRandomNumbers(length: number): Uint32Array {
  const cryptoValues = new Uint32Array(length);
  crypto.getRandomValues(cryptoValues);
  return cryptoValues;
}

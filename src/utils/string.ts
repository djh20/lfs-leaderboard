/**
 * Converts the given string to a character buffer that matches the desired size.
 * @param str The source string.
 * @param bufferSize The desired buffer size.
 * @returns The buffer.
 */
export function stringToBuffer(str: string, bufferSize: number) {
  let buffer = Buffer.alloc(bufferSize);

  for (let i = 0; i < str.length; i++) {
    buffer[i] = str.charCodeAt(i);
  }

  return buffer;
}

/**
 * Checks if the given character code is a valid ascii character. This is used for
 * determining if vehicles are official or modded.
 * @param charCode The character code to check.
 * @returns `true` if valid ascii character, otherwise `false`.
 */
export function isAsciiChar(charCode: number): boolean {
  if (charCode >= 48 && charCode <= 57) return true; // 0 to 9
  if (charCode >= 65 && charCode <= 90) return true; // A to Z
  if (charCode >= 97 && charCode <= 122) return true; // a to z
  return false;
}

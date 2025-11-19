import { PUBLIC_BASE_URL } from "./config.js";
// Recording URL

export function makeRecordingUrl(filename: string) {
  return `${PUBLIC_BASE_URL}/uploads/${filename}`;
}
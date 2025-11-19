import { PUBLIC_BASE_URL } from "./config.js";

export function makeRecordingUrl(filename: string) {
  return `${PUBLIC_BASE_URL}/uploads/${filename}`;
}
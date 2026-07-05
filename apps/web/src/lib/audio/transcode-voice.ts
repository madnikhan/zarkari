import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function getFfmpegPath(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static") as string | null;
    return ffmpegStatic || null;
  } catch {
    return null;
  }
}

export function canTranscodeVoice(): boolean {
  return Boolean(getFfmpegPath());
}

/** Convert WebM/OGG voice notes to AAC-in-MP4 for Safari/iOS playback. */
export async function transcodeVoiceToMp4(input: Buffer, inputExt: string): Promise<Buffer | null> {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) return null;

  const id = randomUUID();
  const safeExt = inputExt.replace(/[^a-z0-9]/gi, "") || "webm";
  const inputPath = join(tmpdir(), `zarkari-voice-in-${id}.${safeExt}`);
  const outputPath = join(tmpdir(), `zarkari-voice-out-${id}.m4a`);

  try {
    await writeFile(inputPath, input);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, [
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outputPath,
      ]);
      let stderr = "";
      proc.stderr?.on("data", (d: Buffer) => {
        stderr += d.toString();
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `ffmpeg exited ${code}`));
      });
    });
    return await readFile(outputPath);
  } catch (err) {
    console.warn("Voice transcode failed:", err);
    return null;
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

export function voiceNeedsTranscode(mimeType: string): boolean {
  const base = mimeType.split(";")[0]?.toLowerCase() ?? "";
  return base.includes("webm") || base.includes("ogg");
}

import { addDaysIso, todayIsoDate } from "@/lib/date";
import type { ModuleName, ParsedTaskInput, Priority } from "@/lib/types";

export type VoiceLanguage = "en-US" | "zh-CN" | "auto";

const chineseNumberMap: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const englishNumberMap: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function speechRecognitionLanguage(language: VoiceLanguage) {
  if (language === "zh-CN") return "zh-CN";
  if (language === "en-US") return "en-US";

  // Browser SpeechRecognition cannot truly listen in two languages at once.
  // Auto/Mixed uses the browser locale for speech capture; the parser below
  // still detects English and Chinese from pasted or recognized text.
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

export function parseVoiceTask(transcript: string): ParsedTaskInput {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const hasChinese = /[\u3400-\u9fff]/.test(text);

  const module = inferModule(lower, text);
  const priority = inferPriority(lower, text);
  const estimatedDurationMinutes = inferDuration(lower, text, hasChinese);
  const date = inferDate(lower, text);
  const time = inferTime(lower, text, hasChinese);
  const title = inferTitle(text, module, hasChinese);

  return {
    title,
    module,
    priority,
    estimatedDurationMinutes,
    date,
    time,
    notes: text,
  };
}

function inferModule(lower: string, original: string): ModuleName {
  if (/weekly|week|本周|周计划|每周/.test(lower) || /本周|周计划|每周/.test(original)) return "Weekly Plan";
  if (/monthly|month|本月|月计划|每月/.test(lower) || /本月|月计划|每月/.test(original)) return "Monthly Plan";
  if (/study|read|paper|course|learn|学习|阅读|论文|课程|读书/.test(lower) || /学习|阅读|论文|课程|读书/.test(original)) {
    return "Study";
  }
  if (/project|code|build|ship|app|项目|代码|开发|编程/.test(lower) || /项目|代码|开发|编程/.test(original)) return "Project";
  if (/health|run|workout|gym|sleep|walk|健康|跑步|健身|运动|睡眠|散步/.test(lower) || /健康|跑步|健身|运动|睡眠|散步/.test(original)) {
    return "Health";
  }
  if (/career|job|portfolio|interview|resume|工作|职业|简历|面试|求职/.test(lower) || /工作|职业|简历|面试|求职/.test(original)) {
    return "Career";
  }
  return "Project";
}

function inferPriority(lower: string, original: string): Priority {
  if (/high priority|urgent|important/.test(lower) || /优先级高|高优先级|重要|紧急/.test(original)) return "High";
  if (/low priority|not urgent/.test(lower) || /优先级低|低优先级|不急/.test(original)) return "Low";
  return "Medium";
}

function inferDuration(lower: string, original: string, hasChinese: boolean) {
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs)/);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);

  const wordHourMatch = lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(hour|hours|hr|hrs)\b/);
  if (wordHourMatch) return englishNumberMap[wordHourMatch[1]] * 60;

  const minuteMatch = lower.match(/(\d+)\s*(minute|minutes|min|mins)/);
  if (minuteMatch) return Number(minuteMatch[1]);

  const wordMinuteMatch = lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(minute|minutes|min|mins)\b/);
  if (wordMinuteMatch) return englishNumberMap[wordMinuteMatch[1]];

  if (hasChinese) {
    const chineseHour = original.match(/([一二两三四五六七八九十\d]+)\s*(个)?\s*(小时|钟头)/);
    if (chineseHour) return chineseNumberToNumber(chineseHour[1]) * 60;
    const chineseMinute = original.match(/([一二两三四五六七八九十\d]+)\s*(分钟|分)/);
    if (chineseMinute) return chineseNumberToNumber(chineseMinute[1]);
  }

  return 60;
}

function inferDate(lower: string, original: string) {
  const today = todayIsoDate();
  if (/day after tomorrow/.test(lower) || /后天/.test(original)) return addDaysIso(today, 2);
  if (/tomorrow/.test(lower) || /明天/.test(original)) return addDaysIso(today, 1);
  if (/today/.test(lower) || /今天/.test(original)) return today;
  return today;
}

function inferTime(lower: string, original: string, hasChinese: boolean) {
  const explicit = lower.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = explicit[2] ?? "00";
    const meridiem = explicit[3];
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  if (hasChinese) {
    const chineseTime = original.match(/(早上|上午|中午|下午|晚上)?\s*([一二两三四五六七八九十\d]+)\s*点\s*(半|[0-5]?\d分?)?/);
    if (chineseTime) {
      const period = chineseTime[1] ?? "";
      let hour = chineseNumberToNumber(chineseTime[2]);
      const minute = chineseTime[3]?.startsWith("半") ? "30" : (chineseTime[3]?.replace("分", "") ?? "00").padStart(2, "0");
      if ((period === "下午" || period === "晚上") && hour < 12) hour += 12;
      if (period === "中午" && hour < 11) hour += 12;
      return `${String(Math.min(hour, 23)).padStart(2, "0")}:${minute}`;
    }
  }

  if (/afternoon/.test(lower) || /下午/.test(original)) return "14:00";
  if (/morning/.test(lower) || /早上|上午/.test(original)) return "09:00";
  if (/evening|tonight/.test(lower) || /晚上/.test(original)) return "19:00";
  return "09:00";
}

function inferTitle(original: string, module: ModuleName, hasChinese: boolean) {
  let title = original
    .replace(/tomorrow|today|day after tomorrow|this afternoon|afternoon|morning|evening/gi, "")
    .replace(/\b(for|about)\s+\d+(?:\.\d+)?\s*(hours?|hrs?|minutes?|mins?)\b/gi, "")
    .replace(/\b(for|about)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s*(hours?|hrs?|minutes?|mins?)\b/gi, "")
    .replace(/\b(high|medium|low)\s+priority\b/gi, "")
    .replace(/明天|今天|后天|早上|上午|中午|下午|晚上|我要|我需要|需要|要|计划|安排|大概|大约|左右|优先级高|高优先级|优先级低|低优先级|重要|紧急|不急/g, "")
    .replace(/[，。！？、,.!?]/g, " ")
    .trim();

  if (hasChinese) {
    title = title
      .replace(/[一二两三四五六七八九十\d]+\s*(个)?\s*(小时|钟头)/g, "")
      .replace(/[一二两三四五六七八九十\d]+\s*(分钟|分)/g, "")
      .replace(/(早上|上午|中午|下午|晚上)?\s*[一二两三四五六七八九十\d]+\s*点\s*(半|[0-5]?\d分?)?/g, "");
  }

  title = title.replace(/\s+/g, " ").trim();
  if (title.length > 1) return title;

  const fallback: Record<ModuleName, string> = {
    Study: "Study session",
    Project: "Project work",
    Health: "Health routine",
    Career: "Career task",
    "Weekly Plan": "Weekly goal",
    "Monthly Plan": "Monthly goal",
  };
  return fallback[module];
}

function chineseNumberToNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "十") return 10;
  if (value.includes("十")) {
    const [left, right] = value.split("十");
    return (left ? chineseNumberMap[left] : 1) * 10 + (right ? chineseNumberMap[right] : 0);
  }
  return chineseNumberMap[value] ?? 1;
}

// TODO: Replace this rule-based parser with a backend endpoint powered by
// FastAPI + faster-whisper for transcription and a language-aware parser for
// richer date/time extraction once the MVP moves beyond browser-only storage.

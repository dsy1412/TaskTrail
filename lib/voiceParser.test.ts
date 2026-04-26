import { describe, expect, it, vi } from "vitest";
import { parseVoiceTask, speechRecognitionLanguage } from "@/lib/voiceParser";

describe("parseVoiceTask", () => {
  it("extracts an English project task with date, afternoon time, duration, and high priority", () => {
    vi.setSystemTime(new Date("2026-04-26T10:00:00-04:00"));

    const task = parseVoiceTask(
      "Tomorrow afternoon I need to work on the project code for two hours, high priority",
    );

    expect(task.module).toBe("Project");
    expect(task.priority).toBe("High");
    expect(task.date).toBe("2026-04-27");
    expect(task.time).toBe("14:00");
    expect(task.estimatedDurationMinutes).toBe(120);
    expect(task.title).toContain("project code");
  });

  it("extracts a Chinese project task with explicit 2pm time and two-hour duration", () => {
    vi.setSystemTime(new Date("2026-04-26T10:00:00-04:00"));

    const task = parseVoiceTask("明天下午两点我要写项目代码，大概两个小时，优先级高");

    expect(task.module).toBe("Project");
    expect(task.priority).toBe("High");
    expect(task.date).toBe("2026-04-27");
    expect(task.time).toBe("14:00");
    expect(task.estimatedDurationMinutes).toBe(120);
    expect(task.title).toContain("项目代码");
  });

  it("extracts Chinese health and low priority minute tasks", () => {
    vi.setSystemTime(new Date("2026-04-26T10:00:00-04:00"));

    const task = parseVoiceTask("今天晚上八点跑步三十分钟，优先级低");

    expect(task.module).toBe("Health");
    expect(task.priority).toBe("Low");
    expect(task.date).toBe("2026-04-26");
    expect(task.time).toBe("20:00");
    expect(task.estimatedDurationMinutes).toBe(30);
    expect(task.title).toContain("跑步");
  });

  it("extracts weekly and monthly goal modules from speech", () => {
    expect(parseVoiceTask("Plan weekly review for one hour").module).toBe("Weekly Plan");
    expect(parseVoiceTask("本月复盘目标，大概一个小时").module).toBe("Monthly Plan");
  });

  it("falls back to a usable default task when speech has little structure", () => {
    const task = parseVoiceTask("quick planning");

    expect(task.module).toBe("Project");
    expect(task.priority).toBe("Medium");
    expect(task.estimatedDurationMinutes).toBe(60);
    expect(task.title).toBe("quick planning");
  });
});

describe("speechRecognitionLanguage", () => {
  it("uses explicit recognition languages and a stable auto fallback", () => {
    expect(speechRecognitionLanguage("en-US")).toBe("en-US");
    expect(speechRecognitionLanguage("zh-CN")).toBe("zh-CN");
    expect(["en-US", "zh-CN"]).toContain(speechRecognitionLanguage("auto"));
  });
});

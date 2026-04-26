import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceTaskInput } from "@/components/VoiceTaskInput";
import type { ParsedTaskInput } from "@/lib/types";

describe("VoiceTaskInput", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-04-26T10:00:00-04:00"));
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it("parses pasted Chinese text into a structured task", async () => {
    const onParsedTask = vi.fn<(task: ParsedTaskInput) => void>();
    const user = userEvent.setup();
    render(<VoiceTaskInput onParsedTask={onParsedTask} />);

    await user.type(screen.getByPlaceholderText("Say or paste: Tomorrow afternoon, project code, two hours..."), "明天下午两点我要写项目代码，大概两个小时，优先级高");
    await user.click(screen.getByRole("button", { name: "Parse voice text" }));

    expect(onParsedTask).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "Project",
        priority: "High",
        date: "2026-04-27",
        time: "14:00",
        estimatedDurationMinutes: 120,
      }),
    );
  });

  it("shows a fallback when SpeechRecognition is not supported", async () => {
    const user = userEvent.setup();
    render(<VoiceTaskInput onParsedTask={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(screen.getByRole("status")).toHaveTextContent("SpeechRecognition is not available");
  });

  it("surfaces microphone permission errors from browser speech recognition", async () => {
    class RecognitionMock {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult = null;
      onend = null;
      onerror: ((event: { error?: string }) => void) | null = null;

      start() {
        this.onerror?.({ error: "not-allowed" });
      }

      stop() {}
    }

    (window as any).webkitSpeechRecognition = RecognitionMock;
    const user = userEvent.setup();
    render(<VoiceTaskInput onParsedTask={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Microphone permission is blocked");
    });
  });
});

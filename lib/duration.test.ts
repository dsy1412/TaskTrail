import { describe, expect, it } from "vitest";
import { durationToMinutes, formatDuration } from "@/lib/duration";

describe("duration helpers", () => {
  it("formats instant and longer planning durations", () => {
    expect(formatDuration(0)).toBe("Instant");
    expect(formatDuration(75)).toBe("1h 15m");
    expect(formatDuration(durationToMinutes(2, "weeks"))).toBe("2w");
    expect(formatDuration(durationToMinutes(1, "months"))).toBe("1mo");
  });
});

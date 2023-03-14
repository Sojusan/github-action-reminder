import { describe, expect, test } from "@jest/globals";
import convertHoursToMilliseconds from "../../src/utils/helpers";

describe("convertHoursToMilliseconds", () => {
  test.each([
    [0, 0],
    [1, 3_600_000],
    [48, 172_800_000],
  ])("convert %p hours to milliseconds", (hours: number, result: number) => {
    expect(convertHoursToMilliseconds(hours)).toBe(result);
  });
});

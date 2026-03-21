// Mock speech recognition result
function processVoiceInput(input) {
  // simulate voice → text processing
  if (!input) return "No input detected";
  return input.toLowerCase();
}

test("should convert voice input to lowercase text", () => {
  const result = processVoiceInput("Find Hotels in Colombo");
  expect(result).toBe("find hotels in colombo");
});

test("should handle empty voice input", () => {
  const result = processVoiceInput("");
  expect(result).toBe("No input detected");
});

test("should process valid travel command", () => {
  const result = processVoiceInput("Plan trip to Kandy");
  expect(result).toContain("kandy");
});

test("should not modify original input", () => {
  const input = "Find Hotels in Colombo";
  const copy = input;
  processVoiceInput(input);
  expect(input).toBe(copy);
});

test("should handle mixed case and spacing", () => {
  const result = processVoiceInput("   PLAN Trip To GALLE   ");
  expect(result.trim()).toBe("plan trip to galle");
});


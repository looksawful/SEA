import { describe, expect, it } from "vitest";
import { GAME_ORDER, GAMES } from "@/utils/gameConfig";

describe("game config", () => {
  it("exports a config for every game id", () => {
    GAME_ORDER.forEach((id) => {
      expect(GAMES[id]).toBeDefined();
    });
  });

  it("provides an icon for each game", () => {
    GAME_ORDER.forEach((id) => {
      expect(typeof GAMES[id].icon).toBe("function");
    });
  });
});

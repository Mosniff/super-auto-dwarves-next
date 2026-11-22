import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { findCharacterTemplate } from "./characterTemplates";
import {
  CHARACTER_PORTRAIT_FILE_NAMES,
  characterPortraitSrc,
} from "./characterPortraits";

describe("characterPortraitSrc", () => {
  it("CP1: looks portraits up by template id, own properties only", () => {
    expect(
      ["borin", "ogden", "fixture-dwarf", "toString"].map(
        (characterTemplateId) => characterPortraitSrc({ characterTemplateId }),
      ),
    ).toEqual([
      "/character_portraits/borin.jpg",
      "/character_portraits/ogden.jpg",
      null,
      null,
    ]);
  });

  it("CP2: every portrait entry is for a real template", () => {
    expect(
      Object.keys(CHARACTER_PORTRAIT_FILE_NAMES).filter(
        (characterTemplateId) =>
          findCharacterTemplate(characterTemplateId) === undefined,
      ),
    ).toEqual([]);
  });

  it("CP3: every listed portrait file exists", () => {
    expect(
      Object.values(CHARACTER_PORTRAIT_FILE_NAMES).filter(
        (portraitFileName) =>
          !existsSync(
            join(
              process.cwd(),
              "public",
              "character_portraits",
              portraitFileName,
            ),
          ),
      ),
    ).toEqual([]);
  });
});

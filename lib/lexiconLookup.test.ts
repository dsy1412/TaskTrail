import { describe, expect, it } from "vitest";
import {
  cleanTranslatedText,
  containsChineseText,
  extractDatamuseMetadata,
  extractDictionaryMetadata,
  isSentenceInput,
  mergeLexicalMetadata,
  trimForTranslation,
} from "@/lib/lexiconLookup";

describe("lexicon lookup helpers", () => {
  it("extracts IPA, definitions, examples, and synonyms from Dictionary API data", () => {
    const result = extractDictionaryMetadata([{
      phonetic: "fəˈlɒsəfi",
      meanings: [{ definitions: [{
        definition: "The study of knowledge and existence.",
        example: "She studies philosophy.",
        synonyms: ["thought", "doctrine"],
      }] }],
    }]);

    expect(result).toEqual({
      ipa: "/fəˈlɒsəfi/",
      meaning: "The study of knowledge and existence.",
      example: "She studies philosophy.",
      related: ["thought", "doctrine"],
    });
  });

  it("uses Datamuse IPA and definitions when the primary dictionary is unavailable", () => {
    const fallback = extractDatamuseMetadata([{
      word: "philosophy",
      defs: ["n\tAn academic discipline that seeks truth through reasoning."],
      tags: ["query", "ipa_pron:fʌɫˈɑsʌfi"],
    }]);
    const result = mergeLexicalMetadata(extractDictionaryMetadata(undefined), fallback);

    expect(result.ipa).toBe("/fʌɫˈɑsʌfi/");
    expect(result.meaning).toBe("An academic discipline that seeks truth through reasoning.");
  });

  it("recognizes sentences and cleans translated text", () => {
    expect(isSentenceInput("Canvas course home page confirms this.")).toBe(true);
    expect(isSentenceInput("Rational Agents")).toBe(false);
    expect(cleanTranslatedText("课程&amp;工作&#39;笔记&#12290;")).toBe("课程&工作'笔记。");
    expect(containsChineseText("兼职药房协调员")).toBe(true);
  });

  it("keeps translation requests within the provider limit", () => {
    const text = `${"definition ".repeat(80)}Final sentence.`;
    expect(trimForTranslation(text).length).toBeLessThanOrEqual(423);
  });
});

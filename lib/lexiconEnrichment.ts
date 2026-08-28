import type { LexiconEntry } from "@/lib/types";

export type LexiconEnrichment = Partial<
  Pick<
    LexiconEntry,
    "ipa" | "phonics" | "fieldContext" | "meaning" | "association" | "example" | "exampleTranslation" | "related"
  >
>;

const localLexiconEnrichments: Record<string, LexiconEnrichment> = {
  intensity: {
    ipa: "/ɪnˈtɛnsəti/",
    phonics: "in-TEN-si-ty; stress on ten",
    fieldContext: "CIS 5800 image formation",
    meaning: "强度；在图像里常指像素亮度或光的强弱。",
    association: "intense = strong; intensity = strength of light or signal",
    example: "Image intensity mixes illumination, material, and shape.",
    exampleTranslation: "图像强度混合了光照、材质和形状信息。",
    related: ["brightness", "illumination", "radiance", "pixel"],
  },
  pixel: {
    ipa: "/ˈpɪksəl/",
    phonics: "pix + el; stress on pix",
    fieldContext: "computer vision",
    meaning: "像素；图像中最小的采样单位。",
    association: "picture element -> pixel",
    example: "A pixel records image intensity at one image location.",
    exampleTranslation: "一个 pixel 记录图像中某个位置的强度。",
    related: ["image", "intensity", "sensor"],
  },
  sensor: {
    ipa: "/ˈsɛnsər/",
    phonics: "sense + -or; stress on sense",
    fieldContext: "camera model",
    meaning: "传感器；相机中接收光并形成图像信号的部件。",
    association: "sense light -> sensor",
    example: "The sensor response turns incoming light into image measurements.",
    exampleTranslation: "sensor response 会把进入相机的光转成图像测量值。",
    related: ["camera", "pixel", "image formation"],
  },
  "image formation": {
    ipa: "/ˈɪmɪdʒ fɔːrˈmeɪʃən/",
    phonics: "image + formation; main stress on formation",
    fieldContext: "CIS 5800",
    meaning: "图像形成；从场景、光照、材质、相机到图像的过程。",
    association: "world + light + camera -> image",
    example: "Image formation explains why vision is an inverse problem.",
    exampleTranslation: "Image formation 解释了为什么视觉是一个反问题。",
    related: ["radiance", "reflectance", "projection"],
  },
  "inverse problem": {
    ipa: "/ˌɪnˈvɜːrs ˈprɑːbləm/",
    phonics: "in-VERSE PROB-lem; stress on verse and prob",
    fieldContext: "computer vision",
    meaning: "反问题；从结果反推原因，比如从图像反推形状、材质和光照。",
    association: "output -> hidden causes",
    example: "Computer vision is hard because image understanding is an inverse problem.",
    exampleTranslation: "Computer vision 很难，因为图像理解本质上是从结果反推原因。",
    related: ["image formation", "shape", "illumination"],
  },
};

export function getLocalLexiconEnrichment(text: string): LexiconEnrichment | undefined {
  const direct = localLexiconEnrichments[lexiconLookupKey(text)];
  if (direct) return direct;
  return undefined;
}

export function lexiconLookupKey(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

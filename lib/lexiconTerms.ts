import type { ActivityEvent, LexiconEntry, PlannerState } from "@/lib/types";

const LEXICON_TERMS_IMPORT_EVENT_ID = "lexicon_terms_cis5800_fall_2026_v1";
const LEXICON_TERMS_SOURCE = "cis5800_image_formation_lecture";
const LEXICON_TERMS_CREATED_AT = "2026-08-28T08:00:00.000Z";

const lexiconTerms = [
  {
    id: "radiance",
    word: "radiance",
    ipa: "/ˈreɪdiəns/",
    meaning: "辐亮度；沿某个方向传播的光",
    fieldContext: "CIS 5800 radiometry",
    association: "ray + direction + light field",
    example: "Radiance describes directional light traveling through space.",
    related: ["irradiance", "light field", "outgoing radiance"],
  },
  {
    id: "irradiance",
    word: "irradiance",
    ipa: "/ɪˈreɪdiəns/",
    meaning: "辐照度；一个表面接收到的光",
    fieldContext: "CIS 5800 radiometry",
    association: "in + surface + received light",
    example: "Irradiance drops when the surface turns away from the light.",
    related: ["radiance", "surface normal", "cosine factor"],
  },
  {
    id: "reflectance",
    word: "reflectance",
    ipa: "/rɪˈflɛktəns/",
    meaning: "反射率；材质如何反射光",
    fieldContext: "CIS 5800 image formation",
    association: "reflection + material response",
    example: "Reflectance is mixed with illumination in an image.",
    related: ["BRDF", "albedo", "material"],
  },
  {
    id: "framing",
    word: "framing",
    ipa: "/ˈfreɪmɪŋ/",
    phonics: "frame /freɪm/ + -ing; stress on frame",
    meaning: "这里指课程的定位和理解框架：这门课被定义为 geometric, analytical, computational 的 machine perception。",
    fieldContext: "CIS 5800 course framing",
    association: "frame = put boundaries around an idea; framing = how an idea is positioned",
    example: "Canvas course home page confirms the course framing as geometrical, analytical, and computational machine perception.",
    related: ["course framing", "perspective", "positioning"],
  },
  {
    id: "brdf",
    word: "BRDF",
    ipa: "/ˌbiː ɑːr diː ˈɛf/",
    meaning: "双向反射分布函数",
    fieldContext: "CIS 5800 reflectance model",
    association: "incoming direction -> material -> outgoing direction",
    example: "A BRDF measures how incoming radiance is redirected.",
    related: ["radiance", "reflectance", "Lambertian"],
  },
  {
    id: "lambertian",
    word: "Lambertian",
    ipa: "/læmˈbɜːrtiən/",
    meaning: "朗伯表面；理想漫反射模型",
    fieldContext: "CIS 5800 shading",
    association: "matte surface + same outgoing directions",
    example: "A Lambertian object can still show shading.",
    related: ["diffuse", "albedo", "surface normal"],
  },
  {
    id: "specular",
    word: "specular",
    ipa: "/ˈspɛkjələr/",
    meaning: "镜面反射；高光方向集中",
    fieldContext: "CIS 5800 reflectance",
    association: "mirror-like highlight",
    example: "Specular reflection concentrates light near the mirror direction.",
    related: ["Phong", "reflection", "highlight"],
  },
  {
    id: "diffuse",
    word: "diffuse",
    ipa: "/dɪˈfjuːs/",
    meaning: "漫反射；光被分散到多个方向",
    fieldContext: "CIS 5800 shading",
    association: "spread out light",
    example: "Diffuse reflection is often modeled as Lambertian.",
    related: ["Lambertian", "shading", "albedo"],
  },
  {
    id: "albedo",
    word: "albedo",
    ipa: "/ælˈbiːdoʊ/",
    meaning: "反照率；表面本身的反射颜色/强度",
    fieldContext: "CIS 5800 material",
    association: "material color without lighting",
    example: "Albedo and illumination are hard to separate from one image.",
    related: ["reflectance", "Lambertian", "brightness constancy"],
  },
  {
    id: "shading",
    word: "shading",
    ipa: "/ˈʃeɪdɪŋ/",
    meaning: "明暗变化；由光照、法线、材质共同造成",
    fieldContext: "CIS 5800 image formation",
    association: "surface normal faces light -> bright",
    example: "Shading helps humans infer 3D shape.",
    related: ["surface normal", "illumination", "shape from shading"],
  },
  {
    id: "illumination",
    word: "illumination",
    ipa: "/ɪˌluːmɪˈneɪʃən/",
    meaning: "光照；场景中的光源和亮度分布",
    fieldContext: "CIS 5800 image formation",
    association: "light source + direction + intensity",
    example: "Image intensity mixes illumination, material, and shape.",
    related: ["radiance", "irradiance", "shadow"],
  },
  {
    id: "surface_normal",
    word: "surface normal",
    ipa: "/ˈsɜːrfɪs ˈnɔːrməl/",
    meaning: "表面法向量；垂直于表面的方向",
    fieldContext: "CIS 5800 geometry",
    association: "normal vector decides brightness",
    example: "The dot product between surface normal and light direction controls diffuse brightness.",
    related: ["dot product", "shading", "Lambertian"],
  },
  {
    id: "projection",
    word: "projection",
    ipa: "/prəˈdʒɛkʃən/",
    meaning: "投影；把 3D 点映射到图像平面",
    fieldContext: "CIS 5810 geometry",
    association: "3D world -> 2D image",
    example: "Perspective projection maps camera coordinates to pixels.",
    related: ["camera", "homogeneous coordinates", "focal length"],
  },
  {
    id: "homogeneous_coordinates",
    word: "homogeneous coordinates",
    ipa: "/ˌhoʊməˈdʒiːniəs koʊˈɔːrdənəts/",
    meaning: "齐次坐标；用额外维度表示投影几何",
    fieldContext: "CIS 5810 geometry",
    association: "add one coordinate to handle projection",
    example: "Homogeneous coordinates make projective transforms easier to write.",
    related: ["projection", "homography", "matrix"],
  },
  {
    id: "homography",
    word: "homography",
    ipa: "/hoʊˈmɑːɡrəfi/",
    meaning: "单应性；两个平面视图之间的投影变换",
    fieldContext: "CIS 5810 computational photography",
    association: "plane-to-plane transform",
    example: "A homography can align two images of the same planar surface.",
    related: ["projection", "matrix", "image alignment"],
  },
] satisfies LexiconSeed[];

export function withDefaultLexiconTerms(state: PlannerState): PlannerState {
  const existingIds = new Set(state.lexiconEntries.map((entry) => entry.id));
  const existingWords = new Set(state.lexiconEntries.map((entry) => entry.word.trim().toLowerCase()));
  const existingEventIds = new Set(state.events.map((event) => event.id));
  const entriesToAdd: LexiconEntry[] = [];
  const eventsToAdd: ActivityEvent[] = [];

  lexiconTerms.forEach((term) => {
    const entry = makeSeedLexiconEntry(term);
    if (existingIds.has(entry.id) || existingWords.has(entry.word.trim().toLowerCase())) return;
    entriesToAdd.push(entry);
    eventsToAdd.push({
      id: `lexicon_terms_event_created_${term.id}`,
      type: "LEXICON_CREATED",
      payload: { entry, source: LEXICON_TERMS_SOURCE },
      createdAt: LEXICON_TERMS_CREATED_AT,
    });
  });

  if (!existingEventIds.has(LEXICON_TERMS_IMPORT_EVENT_ID)) {
    eventsToAdd.push({
      id: LEXICON_TERMS_IMPORT_EVENT_ID,
      type: "LEXICON_CREATED",
      payload: {
        source: LEXICON_TERMS_SOURCE,
        importedCount: entriesToAdd.length,
        note: "Default professional lexicon terms for Fall 2026 study.",
      },
      createdAt: LEXICON_TERMS_CREATED_AT,
    });
  }

  if (!entriesToAdd.length && !eventsToAdd.length) return state;

  return {
    ...state,
    lexiconEntries: [...state.lexiconEntries, ...entriesToAdd],
    events: [...state.events, ...eventsToAdd.filter((event) => !existingEventIds.has(event.id))],
  };
}

function makeSeedLexiconEntry(term: LexiconSeed): LexiconEntry {
  return {
    id: `lexicon_seed_${term.id}`,
    word: term.word,
    ipa: term.ipa,
    phonics: term.phonics ?? "",
    fieldContext: term.fieldContext,
    meaning: term.meaning,
    association: term.association,
    example: term.example,
    related: term.related,
    reviewCount: 0,
    createdAt: LEXICON_TERMS_CREATED_AT,
    updatedAt: LEXICON_TERMS_CREATED_AT,
  };
}

type LexiconSeed = {
  id: string;
  word: string;
  ipa: string;
  phonics?: string;
  fieldContext: string;
  meaning: string;
  association: string;
  example: string;
  related: string[];
};

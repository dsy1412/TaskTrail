import type { LexiconEntry } from "@/lib/types";

export type LexiconEnrichment = Partial<
  Pick<
    LexiconEntry,
    "ipa" | "phonics" | "fieldContext" | "meaning" | "association" | "example" | "exampleTranslation" | "related"
  >
>;

const localLexiconEnrichments: Record<string, LexiconEnrichment> = {
  algebra: {
    ipa: "/ˈældʒəbrə/",
    phonics: "AL-ge-bra; stress on al",
    fieldContext: "math foundation for ML",
    meaning: "代数；研究符号、方程和抽象运算规则。",
    association: "unknown x -> algebra",
    example: "Algebra gives the symbolic language behind linear models.",
    exampleTranslation: "Algebra 提供了线性模型背后的符号语言。",
    related: ["linear algebra", "equation", "matrix"],
  },
  analytical: {
    ipa: "/ˌænəˈlɪtɪkəl/",
    phonics: "a-na-LY-ti-cal; stress on ly",
    fieldContext: "CIS 5800 course framing",
    meaning: "分析性的；强调用数学、推导和结构化方法理解问题。",
    association: "analysis -> analytical",
    example: "The course framing is geometrical, analytical, and computational.",
    exampleTranslation: "这门课的定位是几何的、分析的和计算的。",
    related: ["analysis", "geometrical", "computational"],
  },
  calculus: {
    ipa: "/ˈkælkjələs/",
    phonics: "CAL-cu-lus; stress on cal",
    fieldContext: "math foundation for vision and ML",
    meaning: "微积分；研究变化率、导数、积分和连续变化。",
    association: "calculate change -> calculus",
    example: "Calculus helps describe how a loss changes with model parameters.",
    exampleTranslation: "Calculus 帮助描述 loss 如何随模型参数变化。",
    related: ["derivative", "gradient", "vector calculus"],
  },
  computational: {
    ipa: "/ˌkɑːmpjuˈteɪʃənəl/",
    phonics: "com-pu-TA-tion-al; stress on ta",
    fieldContext: "CIS 5800 course framing",
    meaning: "计算性的；强调算法、程序和数值方法。",
    association: "compute -> computation -> computational",
    example: "Computational machine perception uses algorithms to interpret images.",
    exampleTranslation: "Computational machine perception 用算法来解释图像。",
    related: ["algorithm", "machine perception", "analytical"],
  },
  confirms: {
    ipa: "/kənˈfɜːrmz/",
    phonics: "con-FIRMS; stress on firms",
    fieldContext: "academic notes",
    meaning: "确认；说明某个来源支持这个判断。",
    association: "confirm = make sure something is true",
    example: "Canvas course home page confirms the course framing.",
    exampleTranslation: "Canvas 课程主页确认了这门课的定位。",
    related: ["support", "verify", "evidence"],
  },
  framing: {
    ipa: "/ˈfreɪmɪŋ/",
    phonics: "frame /freɪm/ + -ing; stress on frame",
    fieldContext: "CIS 5800 course framing",
    meaning: "定位和理解框架；这里指这门课被如何定义和组织。",
    association: "frame = put boundaries around an idea; framing = how an idea is positioned",
    example: "Canvas course home page confirms the course framing as geometrical, analytical, and computational machine perception.",
    exampleTranslation: "Canvas 课程主页确认了这门课的定位：它从几何、分析和计算三个角度来理解 machine perception。",
    related: ["perspective", "positioning", "course framing"],
  },
  geometrical: {
    ipa: "/ˌdʒiːəˈmɛtrɪkəl/",
    phonics: "ge-o-MET-ri-cal; stress on met",
    fieldContext: "CIS 5800 course framing",
    meaning: "几何的；强调空间、形状、坐标和投影关系。",
    association: "geometry -> geometrical",
    example: "A geometrical view of vision focuses on shape, camera, and projection.",
    exampleTranslation: "视觉中的 geometrical 视角关注形状、相机和投影关系。",
    related: ["geometry", "projection", "homography"],
  },
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
  linear: {
    ipa: "/ˈlɪniər/",
    phonics: "LIN-ear; stress on lin",
    fieldContext: "math foundation for ML",
    meaning: "线性的；满足加法和数乘规则，常用于描述矩阵、向量和模型关系。",
    association: "line -> linear",
    example: "A linear model combines features with weights.",
    exampleTranslation: "Linear model 会用权重把特征线性组合起来。",
    related: ["linear algebra", "matrix", "vector"],
  },
  "linear algebra": {
    ipa: "/ˈlɪniər ˈældʒəbrə/",
    phonics: "LIN-ear AL-ge-bra; stress on lin and al",
    fieldContext: "math foundation for ML, vision, graphics",
    meaning: "线性代数；研究向量、矩阵、线性变换和方程组，是机器学习和计算机视觉的基础。",
    association: "vectors + matrices + transformations",
    example: "Linear algebra represents images, projections, and neural network layers with vectors and matrices.",
    exampleTranslation: "Linear algebra 用向量和矩阵表示图像、投影和神经网络层。",
    related: ["vector", "matrix", "projection", "eigenvector"],
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
  "vector calculus": {
    ipa: "/ˈvɛktər ˈkælkjələs/",
    phonics: "VEC-tor CAL-cu-lus; stress on vec and cal",
    fieldContext: "math foundation for vision, optimization, and physics-driven ML",
    meaning: "向量微积分；把微积分扩展到向量场和多变量函数，常用于梯度、散度、旋度和优化。",
    association: "vector + change -> gradient field",
    example: "Vector calculus explains gradients used in optimization and physical models.",
    exampleTranslation: "Vector calculus 解释了优化和物理模型中使用的梯度。",
    related: ["gradient", "calculus", "optimization", "physics-driven ML"],
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

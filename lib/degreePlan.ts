export type DegreePlanSectionId = "core" | "ai" | "electives" | "thesis";

export interface DegreeCourse {
  code: string;
  title: string;
  term: string;
  note?: string;
}

export interface DegreeRequirement {
  id: string;
  title: string;
  cu: number;
  rule: string;
  section: DegreePlanSectionId;
  courses: DegreeCourse[];
}

export interface ElectiveBucket {
  id: string;
  title: string;
  courses: DegreeCourse[];
  note?: string;
}

export const degreePlanSummary = {
  school: "University of Pennsylvania",
  program: "MSE in Data Science and AI (DSAI)",
  concentration: "Artificial Intelligence Concentration",
  totalCu: 10,
  commonCoreCu: 4,
  concentrationCu: 2,
  electiveCu: 4,
  aiElectiveMinimumCu: 2,
};

export const degreeRequirements: DegreeRequirement[] = [
  {
    id: "linear-algebra-optimization",
    title: "Linear Algebra or Convex Optimization",
    cu: 1,
    rule: "Choose 1 CU",
    section: "core",
    courses: [
      course("CIS 5150", "Fundamentals of Linear Algebra and Optimization", "Fall"),
      course("MATH 5130", "Computational Linear Algebra", "TBD"),
      course("MATH 5140", "Advanced Linear Algebra", "Fall + Spring"),
      course("ESE 6050", "Modern Convex Optimization", "Spring"),
      course("STAT 5810", "Convex Optimization for Statistics and Data Science", "Spring"),
    ],
  },
  {
    id: "statistics",
    title: "Statistics",
    cu: 1,
    rule: "Choose 1 CU",
    section: "core",
    courses: [
      course("ESE 5420", "Statistics for Data Science", "Fall"),
      course("STAT 5110", "Statistical Inference", "TBD / likely Spring"),
      course("STAT 5120", "Mathematical Statistics", "TBD / likely Spring"),
      course("STAT 5350", "Forecasting Methods for Management", "Fall + Spring"),
      course("STAT 5420", "Bayesian Methods and Computation", "TBD"),
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    cu: 1,
    rule: "Choose 1 CU",
    section: "core",
    courses: [
      course("CIS 5190", "Applied Machine Learning / Introduction to Machine Learning", "Fall + Spring"),
      course("CIS 5200", "Machine Learning", "Fall + Spring"),
      course("ESE 5460", "Principles of Deep Learning", "Fall"),
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms",
    cu: 1,
    rule: "Choose 1 CU",
    section: "core",
    courses: [
      course("CIS 5030", "Algorithms for Big Data", "Fall"),
      course("CIS 5020", "Analysis of Algorithms", "Fall"),
      course("CIS 6770", "Advanced Topics in Algorithms and Complexity", "Fall; occasionally Spring", "Offered in Fall 2026."),
    ],
  },
  {
    id: "ai-core",
    title: "Artificial Intelligence Core",
    cu: 1,
    rule: "Required",
    section: "ai",
    courses: [course("CIS 5210", "Artificial Intelligence", "Fall + Spring")],
  },
  {
    id: "vision-language-perception",
    title: "Vision / Language / Perception",
    cu: 1,
    rule: "Choose 1 CU",
    section: "ai",
    courses: [
      course("CIS 5810", "Computer Vision & Computational Photography", "Fall"),
      course("CIS 5300", "Natural Language Processing", "Fall"),
      course("CIS 6800", "Advanced Topics in Machine Perception", "Fall"),
      course("CIS 6300", "Advanced Topics in Natural Language Processing", "Spring"),
    ],
  },
];

export const electiveBuckets: ElectiveBucket[] = [
  {
    id: "ml-multimodal-data",
    title: "Machine Learning, Multi-modal AI and Data Analysis",
    note: "For the AI concentration, at least 2 CU should come from this bucket.",
    courses: [
      course("CIS 5210", "Artificial Intelligence", "Fall + Spring"),
      course("CIS 5220", "Deep Learning for Data Science", "Check Path@Penn / Varies"),
      course("CIS 5270", "Trustworthy Machine Learning", "Check Path@Penn / Varies"),
      course("CIS 5300", "Natural Language Processing", "Fall"),
      course("CIS 5450", "Big Data Analytics", "Check Path@Penn"),
      course("CIS 5800", "Machine Perception", "Fall 2026 offered"),
      course("CIS 5810", "Computer Vision", "Fall"),
      course("CIS 6200", "Advanced Topics in Machine Learning", "Varies"),
      course("CIS 6250", "Theory of Machine Learning / Computational Learning Theory", "Fall 2026 offered"),
      course("CIS 6300", "Advanced Topics in Natural Language Processing", "Spring"),
      course("CIS 6800", "Advanced Topics in Machine Perception", "Fall"),
      course("ESE 5140", "Graph Neural Networks", "Check Path@Penn"),
      course("ESE 5380", "Machine Learning for Time-Series Data", "Check Path@Penn"),
      course("ESE 5410", "Machine Learning for Data Science", "Check Path@Penn"),
      course("ESE 5460", "Principles of Deep Learning", "Fall"),
      course("ESE 6180", "Learning for Dynamics and Control", "Check Path@Penn"),
      course("ESE 6450", "Deep Generative Models", "Check Path@Penn / Varies"),
      course("ESE 6500", "Learning in Robotics", "Check Path@Penn"),
      course("MSE 5760", "Machine Learning and Its Applications in Materials Science", "Check Path@Penn"),
      course("STAT 5710", "Modern Data Mining", "Check Path@Penn"),
    ],
  },
  {
    id: "discovery",
    title: "AI and Data Science for Discovery",
    courses: [
      course("BE 5210", "Brain-Computer Interfaces", "Check Path@Penn"),
      course("BE 5600 / BE 5660", "Network Neuroscience", "Check Path@Penn"),
      course("BE/CIS xxxx", "Generative Models for Medicine", "TBD / new course"),
      course("BE/CIS xxxx", "Machine Learning for Bioscience", "TBD / new course"),
      course("CIS 5350", "Introduction to Bioinformatics", "Check Path@Penn"),
      course("CIS 5360", "Fundamentals of Computational Biology", "Check Path@Penn"),
      course("CIS 5370", "Biomedical Image Analysis", "Check Path@Penn"),
      course("PHYS 5850", "Theoretical and Computational Neuroscience", "Check Path@Penn"),
      course("BE 5060", "Introduction to Neuroengineering", "Check Path@Penn"),
      course("BE 5040", "Biological Data Science II", "Check Path@Penn"),
      course("BE 5670", "Mathematical Computational Methods for Modeling Biological Systems", "Check Path@Penn"),
      course("BMIN 5030", "Data Science for Biomedical Informatics", "Check Path@Penn"),
      course("BMIN 5200", "Foundations of AI in Health", "Check Path@Penn"),
      course("BMIN 5210", "Advanced Methods and Health Applications in Machine Learning", "Check Path@Penn"),
      course("BMIN 5220", "Natural Language Processing for Health", "Check Path@Penn"),
      course("BMIN 5490", "Exploring Data Science Methods with Health Care Data", "Check Path@Penn"),
    ],
  },
  {
    id: "optimization-systems-control",
    title: "Optimization, Systems and Control",
    courses: [
      course("ESE 5000", "Linear Systems Theory", "Check Path@Penn"),
      course("ESE 5050", "Control Systems / Feedback Control Design and Analysis", "Check Path@Penn"),
      course("ESE 5060", "Introduction to Optimization Theory / Linear Optimization", "Check Path@Penn"),
      course("ESE 6050", "Modern Convex Optimization", "Spring"),
      course("ESE 6060", "Combinatorial Optimization", "Check Path@Penn"),
      course("ESE 6190", "Model Predictive Control", "Check Path@Penn"),
      course("ESE 6180", "Learning for Dynamics and Control", "Check Path@Penn"),
    ],
  },
  {
    id: "social-network",
    title: "Social and Network Science",
    note: "Verify active ECON catalog numbers before registration.",
    courses: [
      course("CIS 5230", "Ethical Algorithm Design", "Check Path@Penn"),
      course("ECON 7050 / ECON 7300", "Econometrics I / Fundamentals", "Check Path@Penn"),
      course("ECON 7210 / ECON 8310", "Advanced Cross-Section Econometrics", "Check Path@Penn"),
      course("ECON 7220 / ECON 8320", "Advanced Time-Series Econometrics", "Check Path@Penn"),
      course("MKTG 7760", "Applied Probability Models in Marketing", "Check Path@Penn"),
    ],
  },
  {
    id: "surveys-statistical",
    title: "Surveys and Statistical Methods",
    courses: [
      course("MKTG 7120", "Data and Analysis for Marketing Decisions", "Check Path@Penn"),
      course("OIDD 6120", "Business Analytics", "Check Path@Penn", "Limited to MBA students in some versions."),
      course("STAT 5350", "Forecasting Methods for Management", "Fall + Spring"),
      course("STAT 6210", "Accelerated Regression Analysis", "Check Path@Penn", "May have MBA restrictions."),
      course("STAT 7220", "Predictive Analytics for Business", "Check Path@Penn"),
      course("STAT 9200", "Sample Survey Methods", "Check Path@Penn"),
      course("STAT 9210", "Observational Studies", "Check Path@Penn"),
      course("STAT 9270", "Bayesian Statistical Theory and Methods", "Check Path@Penn"),
      course("STAT 9740", "Modern Regression for the Social, Behavioral, and Biological Sciences", "Check Path@Penn"),
    ],
  },
  {
    id: "data-programming",
    title: "Data-Centric Programming",
    courses: [
      course("CIS 5050", "Software Systems", "Check Path@Penn"),
      course("CIS 5500", "Database and Information Systems", "Check Path@Penn"),
      course("CIS 5520", "Advanced Programming", "Check Path@Penn"),
      course("CIS 5550", "Internet and Web Systems", "Check Path@Penn"),
      course("CIS 5590", "Programming and Problem Solving", "Check Path@Penn"),
      course("CIS 5730", "Software Engineering", "Check Path@Penn"),
      course("CIT 5950", "Computer Systems Programming", "Check Path@Penn"),
      course("CIS 5650", "GPU Programming and Architecture", "Check Path@Penn"),
      course("CIS 5690", "GPU Computing for Machine Learning Systems", "Check Path@Penn"),
      course("CIS 6500", "Advanced Topics in Databases", "Varies"),
      course("ESE 5390", "Hardware/Software Co-Design for Machine Learning", "Check Path@Penn"),
    ],
  },
  {
    id: "robotics",
    title: "Robotics",
    courses: [
      course("MEAM 5200", "Introduction to Robotics", "Check Path@Penn"),
      course("MEAM 6200", "Advanced Robotics", "Check Path@Penn"),
      course("ESE 6500", "Learning in Robotics", "Check Path@Penn"),
      course("ESE 6150", "F1/10 / RoboRacer Autonomous Racing Cars", "Check Path@Penn"),
    ],
  },
  {
    id: "simulation",
    title: "Simulation",
    courses: [
      course("CBE 5250", "Molecular Modeling and Simulations", "Check Path@Penn"),
      course("CBE 5440", "Computational Science of Energy and Chemical Transformations", "Check Path@Penn"),
      course("CBE 5590", "Multiscale / Multi-Modeling of Chemical and Biological Systems", "Check Path@Penn"),
      course("MEAM 5270", "Finite Element Analysis", "Check Path@Penn"),
      course("MEAM 6460", "Computational Mechanics", "Check Path@Penn"),
      course("MSE 5610", "Atomic Modeling in Materials Science", "Check Path@Penn"),
    ],
  },
  {
    id: "math-algorithmic",
    title: "Mathematical and Algorithmic Foundations",
    courses: [
      course("AMCS 5141", "Advanced Linear Algebra", "Check Path@Penn"),
      course("CIS 5020", "Analysis of Algorithms", "Fall"),
      course("CIS 5030", "Algorithms for Big Data", "Fall"),
      course("CIS 6250", "Theory of Machine Learning", "Fall 2026 offered"),
      course("CIS 6770", "Advanced Topics in Algorithms and Complexity", "Fall; occasionally Spring"),
      course("CIT 5960", "Algorithms and Computation", "Check Path@Penn"),
      course("ENM 5020", "Numerical Methods", "Check Path@Penn"),
      course("ENM 5310", "Data-driven Modeling and Probabilistic Scientific Computing", "Check Path@Penn"),
      course("ESE 5060", "Introduction to Optimization Theory", "Check Path@Penn"),
      course("ESE 5450", "Data Mining: Learning from Massive Datasets", "Check Path@Penn"),
      course("ESE 5030", "Simulation Modeling and Analysis", "Check Path@Penn"),
      course("ESE 6050", "Modern Convex Optimization", "Spring"),
      course("ESE 6740", "Information Theory", "Check Path@Penn"),
      course("OIDD 9300", "Stochastic Models", "Check Path@Penn"),
      course("STAT 5150", "Advanced Statistical Inference I / Statistical Methods I", "Check Path@Penn"),
      course("STAT 9270", "Bayesian Statistical Theory and Methods", "Check Path@Penn"),
    ],
  },
  {
    id: "other-electives",
    title: "Other Electives",
    note: "CIS 7000 topics must be relevant to Data Science / AI and may require program approval.",
    courses: [
      course("CIS 5120", "Human-Computer Interaction", "Check Path@Penn"),
      course("CIS 7000", "Special Topics", "Varies"),
    ],
  },
];

export const thesisOptions: DegreeCourse[] = [
  course("DATS 5970", "Master's Thesis", "2 CU", "Confirm how credits apply to elective requirements."),
  course("DATS 5990", "Master's Independent Study", "1 or 2 CU", "Confirm how credits apply to elective requirements."),
];

function course(code: string, title: string, term: string, note?: string): DegreeCourse {
  return { code, title, term, note };
}

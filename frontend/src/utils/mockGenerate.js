const questionBanks = {
  Physics: {
    MCQ: [
      "A body moves with uniform acceleration. Which of the following is true?",
      "The SI unit of force is:",
      "Which law states that every action has an equal and opposite reaction?",
      "The speed of light in vacuum is approximately:",
      "Which quantity is conserved in all types of collisions?",
      "A convex lens has focal length 20 cm. Its power is:",
      "The phenomenon of total internal reflection is used in:",
      "Ohm's law relates which two quantities?",
      "The work done by a force perpendicular to displacement is:",
      "Which type of wave requires a medium to propagate?",
    ],
    ShortAnswer: [
      "Define Newton's second law of motion and write its mathematical form.",
      "Explain the difference between scalar and vector quantities with examples.",
      "What is Archimedes' principle? State its applications.",
      "Define wavelength, frequency, and time period of a wave.",
      "Explain the working principle of a transformer.",
    ],
    LongAnswer: [
      "Derive the equations of motion for a uniformly accelerated body. Explain each variable.",
      "Describe the phenomenon of refraction of light. State Snell's law and derive the formula for refractive index.",
      "Explain the construction and working of an AC generator with a labelled diagram.",
      "What is projectile motion? Derive expressions for time of flight, maximum height, and horizontal range.",
    ],
  },
  Mathematics: {
    MCQ: [
      "The value of sin²θ + cos²θ is:",
      "If f(x) = x² + 3x + 2, then f(0) is:",
      "The derivative of xⁿ with respect to x is:",
      "A circle with radius 7 cm has circumference:",
      "The HCF of 36 and 48 is:",
      "Sum of interior angles of a hexagon is:",
      "If a matrix A is of order 2×3 and B is 3×4, the order of AB is:",
      "The probability of getting a head on tossing a coin is:",
      "∫x dx equals:",
      "The slope of the line y = 3x + 5 is:",
    ],
    ShortAnswer: [
      "Solve the quadratic equation: 2x² - 5x + 3 = 0",
      "Find the area of a triangle with vertices A(0,0), B(4,0), C(0,3).",
      "Differentiate y = x³ + 5x² - 2x + 7 with respect to x.",
      "State and prove the Pythagoras theorem.",
      "Find the median of: 3, 7, 9, 11, 14, 17, 20",
    ],
    LongAnswer: [
      "Prove that √2 is irrational. Use the proof by contradiction method.",
      "Solve the system of equations: 2x + 3y = 12 and x - y = 1. Verify your answer.",
      "Derive the formula for the sum of an arithmetic progression and find the sum of first 20 natural numbers.",
    ],
  },
};

const getQuestionsForSubject = (subject, type, count) => {
  const bank = questionBanks[subject] || questionBanks.Physics;
  const typeKey = type.replace(/\s/g, "");
  const pool = bank[typeKey] || bank.MCQ || [];
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push(pool[i % pool.length] || `Sample ${type} question ${i + 1} for ${subject}.`);
  }

  return result;
};

export async function generatePaper(config) {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const {
    examName,
    subject,
    grade,
    duration,
    totalMarks,
    difficulty,
    language,
    matrix,
    sections,
    examType,
  } = config;

  const paperSections = [];
  const mcqRow = matrix?.find((item) => item.type === "MCQ");
  const shortRow = matrix?.find((item) => item.type === "Short Answer");
  const longRow = matrix?.find((item) => item.type === "Long Answer");
  const tfRow = matrix?.find((item) => item.type === "True/False");
  const fibRow = matrix?.find((item) => item.type === "Fill in the Blank");

  const mcqCount = mcqRow?.count || 5;
  const shortCount = shortRow?.count || 3;
  const longCount = longRow?.count || 2;
  const tfCount = tfRow?.count || 0;
  const fibCount = fibRow?.count || 0;

  if (mcqCount > 0 || tfCount > 0 || fibCount > 0) {
    const questions = [];

    getQuestionsForSubject(subject, "MCQ", mcqCount).forEach((question, index) => {
      questions.push({
        no: index + 1,
        text: question,
        type: "MCQ",
        marks: mcqRow?.marksEach || 1,
        options: [
          "Option A - First possible answer",
          "Option B - Second possible answer",
          "Option C - Third possible answer",
          "Option D - Fourth possible answer",
        ],
      });
    });

    if (tfCount > 0) {
      getQuestionsForSubject(subject, "MCQ", tfCount).forEach((question, index) => {
        questions.push({
          no: mcqCount + index + 1,
          text: `True or False: ${question}`,
          type: "TrueFalse",
          marks: tfRow?.marksEach || 1,
        });
      });
    }

    if (fibCount > 0) {
      for (let index = 0; index < fibCount; index += 1) {
        questions.push({
          no: mcqCount + tfCount + index + 1,
          text: `Fill in the blank: The _______ of ${subject} states that _______.`,
          type: "FIB",
          marks: fibRow?.marksEach || 1,
        });
      }
    }

    paperSections.push({
      name: sections?.[0]?.name || "Section A",
      type: "objective",
      questions,
    });
  }

  if (shortCount > 0) {
    const questions = getQuestionsForSubject(subject, "ShortAnswer", shortCount).map((question, index) => ({
      no: index + 1,
      text: question,
      type: "ShortAnswer",
      marks: shortRow?.marksEach || 2,
    }));

    paperSections.push({
      name: sections?.[1]?.name || "Section B",
      type: "short",
      questions,
    });
  }

  if (longCount > 0) {
    const questions = getQuestionsForSubject(subject, "LongAnswer", longCount).map((question, index) => ({
      no: index + 1,
      text: question,
      type: "LongAnswer",
      marks: longRow?.marksEach || 5,
    }));

    paperSections.push({
      name: sections?.[2]?.name || "Section C",
      type: "long",
      questions,
    });
  }

  return {
    id: Date.now(),
    title: examName || `${subject} ${examType}`,
    examType,
    subject,
    grade,
    duration,
    totalMarks,
    difficulty,
    language,
    generatedAt: new Date().toLocaleDateString("en-IN"),
    sections: paperSections,
  };
}

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { readPdfContent } = require("../utils/file-reader");
const {
  cleanJsonString,
  safeJsonParse,
  validateCvSchema,
} = require("../utils/json-parser");
const jobService = require("./job-service");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const JOB_DESCRIPTION = `
  Product Engineer (Backend) 2025. Looking for engineers who write clean, efficient code.
  This role touches on building AI-powered systems, designing and orchestrating how large language models (LLMs) integrate into the product.
  Key skills: Backend languages (Node.js, Go), Database management (MySQL, PostgreSQL), RESTful APIs, Cloud technologies (AWS, Google Cloud).
  Familiarity with LLM APIs, embeddings, vector databases and prompt design best practices is a strong plus.
`;

async function runEvaluation(jobId, cvPath) {
  try {
    jobService.updateJobStatus(jobId, "processing");
    console.log(`[${jobId}] Processing... Reading CV from path: ${cvPath}`);

    // extract cv content
    const cvContent = await readPdfContent(cvPath);
    console.log('====================================');
    console.log(cvContent);
    console.log('====================================');
    const extractionPrompt = `
            Anda adalah asisten HR teknis. Ekstrak informasi dari CV berikut dalam format JSON:
            CV: """${cvContent}"""
            Format JSON: {"skills": ["skill1", "skill2"], "experience_years": number, "projects": ["desc1", "desc2"]}
            Penting: Hanya kembalikan teks JSON yang valid tanpa tanda backtick atau penjelasan.
        `;

    console.log('====================================');
    console.log(extractionPrompt);
    console.log('====================================');

    const extractionResult = await model.generateContent(extractionPrompt);
    const cleanExtractionText = cleanJsonString(
      extractionResult.response.text()
    );
    const extractedCvData = safeJsonParse(cleanExtractionText);

    if (!validateCvSchema(extractedCvData)) {
      throw new Error("Failed to get valid structured data from CV.");
    }
    console.log(`[${jobId}] CV extracted and validated successfully.`);

    // compare to description
    console.log(`[${jobId}] Comparing CV with job description...`);
    const evaluationPrompt = `
            Anda adalah manajer rekrutmen senior. Berdasarkan Deskripsi Pekerjaan dan data CV, lakukan evaluasi.
            Deskripsi Pekerjaan: """${JOB_DESCRIPTION}"""
            Data CV Kandidat (JSON): ${JSON.stringify(extractedCvData)}
            Tugas Anda:
            1. Hitung "cv_match_rate" (0.0 hingga 1.0).
            2. Tulis "cv_feedback" singkat (satu kalimat).
            Hanya kembalikan hasilnya dalam format JSON berikut, tanpa penjelasan atau backtick:
            {"cv_match_rate": number, "cv_feedback": "string"}
        `;

    const evaluationResult = await model.generateContent(evaluationPrompt);
    const cleanEvaluationText = cleanJsonString(
      evaluationResult.response.text()
    );
    const finalResult = safeJsonParse(cleanEvaluationText);

    if (!finalResult || typeof finalResult.cv_match_rate !== "number") {
      throw new Error("Failed to get a valid evaluation result from AI.");
    }
    console.log(`[${jobId}] Evaluation completed.`);

    jobService.updateJobStatus(jobId, "completed", finalResult);
  } catch (error) {
    console.error(`[${jobId}] An error occurred during evaluation:`, error);
    jobService.updateJobStatus(jobId, "failed", { error: error.message });
  }
}

module.exports = { runEvaluation };

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

async function runEvaluation(jobId, cvPath, jobTitle, jobRequirements) {
  try {
    jobService.updateJobStatus(jobId, "processing");
    console.log(`[${jobId}] Processing... Reading CV from path: ${cvPath}`);

    // extract cv content
    const cvContent = await readPdfContent(cvPath);
    console.log("====================================");
    console.log(cvContent);
    console.log("====================================");
    const extractionPrompt = `
      Anda adalah asisten HR teknis. Ekstrak informasi dari CV berikut dalam format JSON.

      CV: """${cvContent}"""

      Instruksi Format JSON:
      {
        "skills": ["skill1", "skill2"],
        "experience_years": number,
        "projects": ["desc1", "desc2"]
      }

      Instruksi khusus untuk "experience_years": 
      - Hitung total durasi dari SEMUA riwayat pekerjaan yang tercantum.
      - Kembalikan hasilnya sebagai satu angka desimal. Contoh: jika totalnya 3 tahun 6 bulan, kembalikan 3.5. Jika totalnya 4 tahun, kembalikan 4.0.

      Penting: Hanya kembalikan teks JSON yang valid tanpa tanda backtick atau penjelasan.
    `;

    console.log("====================================");
    console.log(extractionPrompt);
    console.log("====================================");

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
      Anda adalah manajer rekrutmen senior. Berdasarkan Jabatan dan Kualifikasi Pekerjaan berikut, lakukan evaluasi.
      
      Jabatan: """${jobTitle}"""
      Kualifikasi Pekerjaan: """${jobRequirements}"""
      
      Data CV Kandidat (JSON): ${JSON.stringify(extractedCvData)}

      Tugas Anda:
      1. Hitung "cv_match_rate" (0.0 hingga 1.0).
      2. Tulis "cv_feedback" singkat (satu kalimat) sebagai rekruiter.
      
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

    const comprehensiveResult = {
      ...extractedCvData,
      ...finalResult,
    };
    console.log(`[${jobId}] Evaluation completed.`);

    jobService.updateJobStatus(jobId, "completed", comprehensiveResult);
  } catch (error) {
    console.error(`[${jobId}] An error occurred during evaluation:`, error);
    jobService.updateJobStatus(jobId, "failed", { error: error.message });
  }
}

module.exports = { runEvaluation };

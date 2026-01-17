const jobService = require("../services/job-service");
const aiService = require("../services/ai-service");

const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CV file is required." });
  }
  res.status(200).json({
    message: "File uploaded successfully. Ready to be evaluated.",
    files: {
      cv_path: req.file.path,
    },
  });
};

const startEvaluation = (req, res) => {
  const { cv_path, jobTitle, jobRequirements } = req.body;
  if (!cv_path || !jobTitle || !jobRequirements) {
    return res
      .status(400)
      .json({
        error:
          "Properti 'cv_path', 'jobTitle', dan 'jobRequirements' dibutuhkan.",
      });
  }

  const job = jobService.createJob();
  console.log(`Evaluation job started with ID: ${job.id}`);

  aiService.runEvaluation(job.id, cv_path, jobTitle, jobRequirements);

  res.status(202).json({ id: job.id, status: job.status });
};

const getEvaluationResult = (req, res) => {
  const { id } = req.params;
  const job = jobService.getJob(id);

  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }
  res.status(200).json(job);
};

module.exports = { handleUpload, startEvaluation, getEvaluationResult };

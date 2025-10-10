const jobService = require("../services/job-service");
const aiService = require("../services/ai-service");

const handleUpload = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "CV files are required." });
  }
  res.status(200).json({
    message: "Files uploaded successfully. Ready to be evaluated.",
    files: {
      // cv_path: req.files.cv[0].path,
      cv_path: req.file.path,
    },
  });
};

const startEvaluation = (req, res) => {
  const { cv_path } = req.body;
  if (!cv_path) {
    return res
      .status(400)
      .json({ error: "Property 'cv_path' is required in the request body." });
  }

  const job = jobService.createJob();
  console.log(`Evaluation job started with ID: ${job.id}`);

  // Menjalankan proses AI di latar belakang (tanpa await)
  aiService.runEvaluation(job.id, cv_path);

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

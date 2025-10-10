const crypto = require("crypto");

const jobs = {};

const createJob = () => {
  const jobId = crypto.randomUUID();
  jobs[jobId] = { id: jobId, status: "queued", result: null };
  return jobs[jobId];
};

const getJob = (jobId) => {
  return jobs[jobId];
};

const updateJobStatus = (jobId, status, result = null) => {
  if (jobs[jobId]) {
    jobs[jobId].status = status;
    if (result) {
      jobs[jobId].result = result;
    }
  }
};

module.exports = { createJob, getJob, updateJobStatus };
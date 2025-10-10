const express = require("express");
const multer = require("multer");
const controller = require("../controllers/evaluation-controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// router.post(
//   "/upload",
//   upload.fields([{ name: "cv" }]),
//   controller.handleUpload
// );
router.post("/upload", upload.single("cv"), controller.handleUpload);
router.post("/evaluate", controller.startEvaluation);
router.get("/result/:id", controller.getEvaluationResult);

module.exports = router;
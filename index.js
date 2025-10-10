require("dotenv").config();
const express = require("express");
const cors = require("cors");
const evaluationRoutes = require("./src/routes/evaluation-routes");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", evaluationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

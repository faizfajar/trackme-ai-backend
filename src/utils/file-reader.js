const fs = require("fs");
const pdf = require("pdf-parse");

const readPdfContent = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error reading PDF file:", error);
    throw new Error("Could not read the PDF file.");
  }
};

module.exports = { readPdfContent };

function cleanJsonString(str) {
  const match = str.match(/\{[\s\S]*\}/);
  return match ? match[0] : str;
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Failed to parse JSON string:", str);
    return null;
  }
}

function validateCvSchema(obj) {
  if (!obj) return false;
  const hasSkills = Array.isArray(obj.skills);
  const hasExperience = typeof obj.experience_years === "number";
  return hasSkills && hasExperience;
}

module.exports = {
  cleanJsonString,
  safeJsonParse,
  validateCvSchema,
};

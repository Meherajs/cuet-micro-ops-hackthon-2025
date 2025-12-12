export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type must be one of these
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting
        "refactor", // Code restructure
        "test", // Tests
        "chore", // Maintenance
        "ci", // CI changes
        "perf", // Performance
        "build", // Build system
        "revert", // Revert commit
      ],
    ],
    // Subject must not be empty
    "subject-empty": [2, "never"],
    // Type must not be empty
    "type-empty": [2, "never"],
    // Subject max length
    "subject-max-length": [2, "always", 100],
  },
};

import next from "eslint-config-next/core-web-vitals";

export default [
  ...next,
  {
    // React Compiler advisory rules: this codebase does not run the compiler, and the flagged
    // patterns (mount-time detection in effects, Date.now() in server components) are intentional.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  { ignores: [".next/**", ".next-prod/**", "node_modules/**", "public/**", "src/content/generated/**"] },
];

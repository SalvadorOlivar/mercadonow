import tseslint from "typescript-eslint";

const DOMAIN_OUTER_LAYERS = [
  "../application/**",
  "../../application/**",
  "../../../application/**",
  "../../../../application/**",
  "../infrastructure/**",
  "../../infrastructure/**",
  "../../../infrastructure/**",
  "../../../../infrastructure/**",
  "../presentation/**",
  "../../presentation/**",
  "../../../presentation/**",
  "../../../../presentation/**",
  "@/billing/application/**",
  "@/billing/infrastructure/**",
  "@/billing/presentation/**",
];

const APPLICATION_OUTER_LAYERS = [
  "../infrastructure/**",
  "../../infrastructure/**",
  "../../../infrastructure/**",
  "../../../../infrastructure/**",
  "../presentation/**",
  "../../presentation/**",
  "../../../presentation/**",
  "../../../../presentation/**",
  "@/billing/infrastructure/**",
  "@/billing/presentation/**",
];

const PRESENTATION_IMPORTS = [
  "../presentation/**",
  "../../presentation/**",
  "../../../presentation/**",
  "../../../../presentation/**",
  "@/billing/presentation/**",
];

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["apps/api/src/billing/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@nestjs/**", "pg", "pg/**", "node:*", ...DOMAIN_OUTER_LAYERS],
              message:
                "Billing domain must remain pure and cannot depend on frameworks, I/O, or outer layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/src/billing/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@nestjs/**", "pg", "pg/**", ...APPLICATION_OUTER_LAYERS],
              message:
                "Billing application can depend on domain, but not on frameworks or outer adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/src/billing/infrastructure/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: PRESENTATION_IMPORTS,
              message: "Infrastructure cannot depend on the presentation layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/shared/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@nestjs/**",
                "react",
                "react/**",
                "next",
                "next/**",
                "pg",
                "pg/**",
                "node:*",
              ],
              message: "@mercadonow/shared must remain framework and runtime agnostic.",
            },
          ],
        },
      ],
    },
  },
);

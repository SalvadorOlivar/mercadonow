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
  "@/billing/application/**",
  "@/billing/infrastructure/**",
];

const APPLICATION_OUTER_LAYERS = [
  "../infrastructure/**",
  "../../infrastructure/**",
  "../../../infrastructure/**",
  "../../../../infrastructure/**",
  "@/billing/infrastructure/**",
];

const INBOUND_ADAPTER_IMPORTS = [
  "../in/**",
  "../../in/**",
  "../../../in/**",
  "../../../../in/**",
  "../../../../../in/**",
  "../../../../../../in/**",
  "@/billing/infrastructure/adapters/in/**",
];

const OUTBOUND_ADAPTER_IMPORTS = [
  "../out/**",
  "../../out/**",
  "../../../out/**",
  "../../../../out/**",
  "../../../../../out/**",
  "../../../../../../out/**",
  "@/billing/infrastructure/adapters/out/**",
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
    files: ["apps/api/src/billing/infrastructure/adapters/out/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: INBOUND_ADAPTER_IMPORTS,
              message: "Outbound adapters cannot depend on inbound adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/src/billing/infrastructure/adapters/in/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: OUTBOUND_ADAPTER_IMPORTS,
              message: "Inbound adapters cannot depend on outbound adapters.",
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

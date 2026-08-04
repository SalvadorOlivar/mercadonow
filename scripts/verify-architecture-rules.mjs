import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });

const probes = [
  {
    name: "domain cannot import application",
    filePath: "apps/api/src/billing/domain/architecture-probe.ts",
    code: 'import "../application/index";',
  },
  {
    name: "domain cannot import NestJS",
    filePath: "apps/api/src/billing/domain/architecture-probe.ts",
    code: 'import "@nestjs/common";',
  },
  {
    name: "application cannot import infrastructure",
    filePath: "apps/api/src/billing/application/architecture-probe.ts",
    code: 'import "../infrastructure/index";',
  },
  {
    name: "infrastructure cannot import presentation",
    filePath: "apps/api/src/billing/infrastructure/architecture-probe.ts",
    code: 'import "../presentation/index";',
  },
  {
    name: "shared cannot import React",
    filePath: "packages/shared/src/architecture-probe.ts",
    code: 'import "react";',
  },
];

const failures = [];
for (const probe of probes) {
  const [result] = await eslint.lintText(probe.code, {
    filePath: probe.filePath,
  });
  const restrictionTriggered = result?.messages.some(
    (message) => message.ruleId === "no-restricted-imports",
  );
  if (restrictionTriggered !== true) failures.push(probe.name);
}

if (failures.length > 0) {
  process.stderr.write(
    `Architecture rule probes did not fail as expected:\n${failures.join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Architecture boundaries verified (${probes.length} forbidden imports).\n`,
  );
}

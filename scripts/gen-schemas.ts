import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { RESOURCE_NAMES } from "../src/core/resource-names";
import { resources } from "../src/modules";

const outDir = join(import.meta.dirname, "..", "schemas");
mkdirSync(outDir, { recursive: true });

for (const name of RESOURCE_NAMES) {
  const schema = z.toJSONSchema(resources[name].schema, {
    io: "input",
    unrepresentable: "any",
  });
  writeFileSync(
    join(outDir, `${name}.json`),
    JSON.stringify(schema, null, 2) + "\n",
  );
}
console.log(`✔ Generated ${RESOURCE_NAMES.length} JSON schemas in schemas/`);

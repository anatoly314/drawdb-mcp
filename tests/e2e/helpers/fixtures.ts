import * as fs from "fs";
import * as path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

function normalize(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function loadFixture(relativePath: string): string {
  const full = path.join(FIXTURES_DIR, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(
      `Fixture not found: ${full}. Run with UPDATE_FIXTURES=1 to generate it (local only, not allowed in CI).`,
    );
  }
  return fs.readFileSync(full, "utf-8");
}

export function assertMatchesFixture(actual: string, fixturePath: string): void {
  const full = path.join(FIXTURES_DIR, fixturePath);
  const normalizedActual = normalize(actual);

  if (process.env.UPDATE_FIXTURES === "1") {
    if (process.env.CI === "true") {
      throw new Error(
        "UPDATE_FIXTURES=1 is forbidden in CI. Generate fixtures locally and commit them.",
      );
    }
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, `${normalizedActual}\n`, "utf-8");
    process.stderr.write(`[e2e] updated fixture: ${full}\n`);
    return;
  }

  const expected = normalize(loadFixture(fixturePath));
  expect(normalizedActual).toBe(expected);
}

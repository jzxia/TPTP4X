const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");

const childScript = path.join(__dirname, "pretty_print_once.js");

// Smoke-test the VSCode-extension-style shape: a parent process starts a fresh
// child for each explicit pretty-print command and checks its exit status.
function prettyPrintInChild(input) {
  return new Promise((resolve, reject) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tptp4x-"));
    const inputPath = path.join(tempDir, "input.p");
    const outputPath = path.join(tempDir, "output.p");
    fs.writeFileSync(inputPath, input, "utf8");

    const child = spawn(process.execPath, [childScript, inputPath, outputPath], {
      stdio: "ignore",
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("pretty-printer child timed out"));
    }, 10000);

    child.on("error", (error) => {
      clearTimeout(timeout);
      fs.rmSync(tempDir, { recursive: true, force: true });
      reject(error);
    });
    child.on("close", (status, signal) => {
      clearTimeout(timeout);
      const output = fs.existsSync(outputPath) ?
        fs.readFileSync(outputPath, "utf8") :
        "";
      fs.rmSync(tempDir, { recursive: true, force: true });
      resolve({ status, signal, stdout: output });
    });
  });
}

async function main() {
  const input = "fof(simple,axiom,\n    ( p => p )).\n";
  const expected = "fof(simple,axiom,\n    ( p\n   => p ) ).\n";
  const result = await prettyPrintInChild(input);

  if (result.status !== 0) {
    console.error("Expected pretty-printer child to succeed.");
    process.exit(1);
  }

  if (result.stdout !== expected) {
    console.error("Unexpected output:");
    console.error(result.stdout);
    process.exit(1);
  }

  const badResult = await prettyPrintInChild("fof(bad,axiom,).\n");
  if (badResult.status === 0) {
    console.error("Expected malformed input to fail.");
    console.error(badResult.stdout);
    process.exit(1);
  }

  console.log(result.stdout);
  console.log("Disposable WASM pretty-printer smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

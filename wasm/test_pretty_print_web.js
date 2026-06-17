const fs = require("fs");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");
const { Worker: NodeWorker } = require("worker_threads");

const workerScript = path.join(__dirname, "pretty_print_web_worker.js");
const wasmModuleUrl = pathToFileURL(path.join(__dirname, "..", "build-wasm", "tptp4X_wasm.js"));
const wasmBinaryPath = path.join(__dirname, "..", "build-wasm", "tptp4X_wasm.wasm");

class ClassicWorkerShim {
  constructor(scriptPath) {
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
    this.terminated = false;

    const bootstrap = `
      const fs = require("fs");
      const vm = require("vm");
      const { parentPort } = require("worker_threads");
      const { fileURLToPath } = require("url");

      const workerScriptUrl = ${JSON.stringify(pathToFileURL(scriptPath).toString())};
      const workerScriptPath = fileURLToPath(workerScriptUrl);

      global.self = global;
      global.location = global.self.location = { href: workerScriptUrl };
      global.postMessage = global.self.postMessage = function (message) {
        parentPort.postMessage(message);
      };
      global.close = global.self.close = function () {
        parentPort.close();
      };
      global.importScripts = function (...urls) {
        for (const url of urls) {
          const resolved = new URL(url, global.self.location.href);
          const filename = fileURLToPath(resolved);
          const code = fs.readFileSync(filename, "utf8");
          vm.runInThisContext(code, { filename });
        }
      };

      // Make the Emscripten glue take its web-worker path, not its Node path.
      global.process = undefined;
      global.require = undefined;
      global.module = undefined;
      global.exports = undefined;

      parentPort.on("message", function (data) {
        try {
          const result = global.self.onmessage({ data });
          if (result && typeof result.catch === "function") {
            result.catch(function (error) {
              throw error;
            });
          }
        } catch (error) {
          throw error;
        }
      });

      vm.runInThisContext(fs.readFileSync(workerScriptPath, "utf8"), {
        filename: workerScriptPath,
      });
    `;

    this.worker = new NodeWorker(bootstrap, { eval: true });
    this.worker.on("message", (data) => {
      if (this.onmessage) {
        this.onmessage({ data });
      }
    });
    this.worker.on("messageerror", (error) => {
      if (this.onmessageerror) {
        this.onmessageerror(error);
      }
    });
    this.worker.on("error", (error) => {
      if (this.onerror) {
        this.onerror({
          message: error && error.message,
          error,
          preventDefault() {},
        });
      }
    });
    this.worker.on("exit", (code) => {
      if (!this.terminated && code !== 0 && this.onerror) {
        this.onerror({
          message: "worker exited with status " + code,
          preventDefault() {},
        });
      }
    });
  }

  postMessage(message) {
    this.worker.postMessage(message);
  }

  terminate() {
    this.terminated = true;
    this.worker.terminate();
  }
}

function makeWorker() {
  return new ClassicWorkerShim(workerScript);
}

async function prettyPrint(input) {
  const { prettyPrintTPTPInWebWorker } = await import("./pretty_print_web.mjs");
  return prettyPrintTPTPInWebWorker(input, {
    workerFactory: makeWorker,
    moduleUrl: wasmModuleUrl,
    wasmBinary: fs.readFileSync(wasmBinaryPath),
  });
}

async function expectRejects(callback, message) {
  try {
    await callback();
  } catch (_error) {
    return;
  }

  throw new Error(message);
}

async function main() {
  const input = "fof(simple,axiom,\n    ( p => p )).\n";
  const expected = "fof(simple,axiom,\n    ( p\n   => p ) ).\n";
  const output = await prettyPrint(input);

  if (output !== expected) {
    console.error("Unexpected output:");
    console.error(output);
    process.exit(1);
  }

  const duplicateNameInput = [
    "fof(dup,axiom,p).",
    "fof(dup,axiom,q).",
    "",
  ].join("\n");
  const duplicateNameOutput = await prettyPrint(duplicateNameInput);
  const duplicateNameCount =
    (duplicateNameOutput.match(/fof\(dup,axiom,/g) || []).length;

  if (duplicateNameCount !== 2) {
    console.error("Expected both duplicate-name formulas to be printed.");
    console.error(duplicateNameOutput);
    process.exit(1);
  }

  await expectRejects(
    () => prettyPrint("fof(bad,axiom,).\n"),
    "Expected malformed input to fail."
  );

  const afterFailureOutput = await prettyPrint(input);
  if (afterFailureOutput !== expected) {
    console.error("Expected a fresh web worker to recover after a failure.");
    console.error(afterFailureOutput);
    process.exit(1);
  }

  console.log(output);
  console.log("Web-worker WASM pretty-printer smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const createTPTP4X = require("../build-wasm/tptp4X_wasm.js");

// One-shot child-process entry point. If JJParser exits on malformed input,
// only this process dies; the parent process observes a nonzero exit status.
function writeString(Module, value) {
  const length = Module.lengthBytesUTF8(value) + 1;
  const pointer = Module._malloc(length);
  Module.stringToUTF8(value, pointer, length);
  return pointer;
}

async function main() {
  // File arguments make command invocation reliable for larger documents.
  // Stdin/stdout are kept for quick manual tests.
  const input = process.argv[2] == null ?
    fs.readFileSync(0, "utf8") :
    fs.readFileSync(process.argv[2], "utf8");
  const outputPath = process.argv[3];
  const wasmPath = path.join(__dirname, "..", "build-wasm", "tptp4X_wasm.wasm");
  const Module = await createTPTP4X({
    locateFile: (file) => path.join(__dirname, "..", "build-wasm", file),
    wasmBinary: fs.readFileSync(wasmPath),
  });

  const inputPtr = writeString(Module, input);
  const outputPtr = Module._tptp4x_pretty_print_tptp(inputPtr);

  if (!outputPtr) {
    Module._free(inputPtr);
    process.exit(1);
  }

  const output = Module.UTF8ToString(outputPtr);
  Module._tptp4x_free_string(outputPtr);
  Module._free(inputPtr);
  if (outputPath == null) {
    process.stdout.write(output);
  } else {
    fs.writeFileSync(outputPath, output, "utf8");
  }
}

main().catch((error) => {
  if (error && error.name === "ExitStatus") {
    process.exit(error.status || 1);
  }
  console.error(error);
  process.exit(1);
});

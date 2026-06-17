/* global createTPTP4X */

(function () {
  "use strict";

  function asUrl(value, fallbackRelativePath) {
    if (value != null && value !== "") {
      return String(value);
    }
    return new URL(fallbackRelativePath, self.location.href).toString();
  }

  function errorMessage(error) {
    if (error == null) {
      return "Unknown pretty-printer worker failure";
    }
    if (typeof error === "string") {
      return error;
    }
    if (error.message) {
      return String(error.message);
    }
    return String(error);
  }

  function errorStatus(error) {
    return error && typeof error.status === "number" ? error.status : undefined;
  }

  function writeString(Module, value) {
    const length = Module.lengthBytesUTF8(value) + 1;
    const pointer = Module._malloc(length);

    if (!pointer) {
      throw new Error("Unable to allocate wasm memory for input");
    }

    Module.stringToUTF8(value, pointer, length);
    return pointer;
  }

  function freeQuietly(callback) {
    try {
      callback();
    } catch (_error) {
      // The worker is one-shot; after a fatal wasm exit the whole heap is discarded.
    }
  }

  function prettyPrint(Module, input) {
    let inputPtr = 0;
    let outputPtr = 0;

    try {
      inputPtr = writeString(Module, input);
      outputPtr = Module._tptp4x_pretty_print_tptp(inputPtr);

      if (!outputPtr) {
        throw new Error("tptp4x_pretty_print_tptp returned NULL");
      }

      return Module.UTF8ToString(outputPtr);
    } finally {
      if (outputPtr) {
        freeQuietly(function () {
          Module._tptp4x_free_string(outputPtr);
        });
      }
      if (inputPtr) {
        freeQuietly(function () {
          Module._free(inputPtr);
        });
      }
    }
  }

  async function loadModule(message) {
    const moduleUrl = asUrl(message.moduleUrl, "../build-wasm/tptp4X_wasm.js");
    const wasmUrl = asUrl(message.wasmUrl, "../build-wasm/tptp4X_wasm.wasm");
    const wasmBinary = message.wasmBinary || await fetch(wasmUrl).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load wasm binary: " + response.status + " " + response.statusText);
      }
      return response.arrayBuffer();
    });

    if (typeof createTPTP4X !== "function") {
      importScripts(moduleUrl);
    }

    if (typeof createTPTP4X !== "function") {
      throw new Error("tptp4X wasm loader did not define createTPTP4X");
    }

    return createTPTP4X({
      locateFile: function (file) {
        return file === "tptp4X_wasm.wasm" ? wasmUrl : new URL(file, moduleUrl).toString();
      },
      print: function () {},
      printErr: function () {},
      wasmBinary: wasmBinary,
    });
  }

  self.onmessage = async function (event) {
    const message = event.data || {};
    const id = message.id;

    try {
      if (typeof message.input !== "string") {
        throw new Error("Expected message.input to be a string");
      }

      const Module = await loadModule(message);
      const output = prettyPrint(Module, message.input);

      self.postMessage({ id: id, ok: true, output: output });
    } catch (error) {
      self.postMessage({
        id: id,
        ok: false,
        error: errorMessage(error),
        status: errorStatus(error),
      });
    } finally {
      setTimeout(function () {
        self.close();
      }, 0);
    }
  };
})();

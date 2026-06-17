let nextRequestId = 1;

function urlString(value) {
  return value == null ? undefined : String(value);
}

function defaultWorkerUrl() {
  return new URL("./pretty_print_web_worker.js", import.meta.url);
}

function createWorker(options) {
  if (typeof options.workerFactory === "function") {
    return options.workerFactory();
  }

  return new Worker(options.workerUrl || defaultWorkerUrl(), {
    name: "tptp4X-pretty-print",
    type: "classic",
  });
}

function wasmBinaryForMessage(wasmBinary) {
  if (wasmBinary == null) {
    return undefined;
  }
  if (wasmBinary instanceof ArrayBuffer) {
    return wasmBinary;
  }
  if (ArrayBuffer.isView(wasmBinary)) {
    return wasmBinary.buffer.slice(
      wasmBinary.byteOffset,
      wasmBinary.byteOffset + wasmBinary.byteLength
    );
  }
  throw new TypeError("wasmBinary must be an ArrayBuffer or typed array");
}

function prettyPrintError(message) {
  const error = new Error(message.error || "TPTP4X pretty-printer failed");
  if (typeof message.status === "number") {
    error.status = message.status;
  }
  return error;
}

export function prettyPrintTPTPInWebWorker(input, options = {}) {
  if (typeof input !== "string") {
    return Promise.reject(new TypeError("input must be a string"));
  }

  const requestId = nextRequestId++;
  const timeoutMs = options.timeoutMs == null ? 10000 : options.timeoutMs;
  let worker;
  let wasmBinary;

  try {
    wasmBinary = wasmBinaryForMessage(options.wasmBinary);
    worker = createWorker(options);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout = 0;

    function finish(callback, value) {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      worker.terminate();
      callback(value);
    }

    worker.onmessage = function (event) {
      const message = event.data || {};
      if (message.id !== requestId) {
        return;
      }
      if (message.ok) {
        finish(resolve, message.output);
      } else {
        finish(reject, prettyPrintError(message));
      }
    };

    worker.onerror = function (event) {
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      finish(reject, new Error(event.message || "TPTP4X pretty-printer worker failed"));
    };

    worker.onmessageerror = function () {
      finish(reject, new Error("TPTP4X pretty-printer worker sent an unreadable message"));
    };

    if (timeoutMs > 0) {
      timeout = setTimeout(function () {
        finish(reject, new Error("TPTP4X pretty-printer worker timed out"));
      }, timeoutMs);
    }

    try {
      worker.postMessage({
        id: requestId,
        input: input,
        moduleUrl: urlString(options.moduleUrl),
        wasmUrl: urlString(options.wasmUrl),
        wasmBinary: wasmBinary,
      });
    } catch (error) {
      finish(reject, error);
    }
  });
}

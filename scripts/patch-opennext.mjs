import fs from "node:fs";
import path from "node:path";

/**
 * Patch @opennextjs/aws/dist/adapters/server-adapter.js
 * In Cloudflare Workers, __dirname is empty string (""), and process.chdir("")
 * throws "Error: no such file or directory". This script wraps it in a safe guard.
 */
function patchServerAdapter() {
  const candidatePaths = [
    path.resolve(process.cwd(), "node_modules/@opennextjs/cloudflare/node_modules/@opennextjs/aws/dist/adapters/server-adapter.js"),
    path.resolve(process.cwd(), "node_modules/@opennextjs/aws/dist/adapters/server-adapter.js"),
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf8");
      if (content.includes("process.chdir(__dirname);") && !content.includes("try {")) {
        content = content.replace(
          "process.chdir(__dirname);",
          `try {
        if (typeof __dirname !== "undefined" && __dirname) {
            process.chdir(__dirname);
        }
    } catch {}`
        );
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`[patch-opennext] Patched process.chdir in ${filePath}`);
      }
    }
  }
}

patchServerAdapter();

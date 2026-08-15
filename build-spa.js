import app from "./dist/server/server.js";
import fs from "fs";

// VITE_PUBLIC_URL must be set in the deployment environment (no trailing slash).
// Example: VITE_PUBLIC_URL=https://random-team-lol.vercel.app
const publicUrl = process.env.VITE_PUBLIC_URL;
if (!publicUrl) {
  console.error("ERROR: VITE_PUBLIC_URL environment variable is not set.");
  console.error("Set it to your production URL, e.g. https://random-team-lol.vercel.app");
  process.exit(1);
}

// Use a stable non-redirecting path to generate the SPA shell.
// The "/" route redirects to "/random-lol", so we render that directly.
const renderUrl = publicUrl.replace(/\/$/, "") + "/en/random-lol";

async function generate() {
  const req = new Request(renderUrl);
  const res = await app.fetch(req, {}, {});
  const html = await res.text();

  if (!html.trim()) {
    throw new Error(
      `Generated HTML is empty. status=${res.status}, location=${res.headers.get("location")}`,
    );
  }

  fs.writeFileSync("dist/client/index.html", html);
  console.log("SPA index.html generated successfully for:", publicUrl);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});

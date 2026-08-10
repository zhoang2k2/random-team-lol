import app from "./dist/server/server.js";
import fs from "fs";

async function generate() {
  const req = new Request("http://localhost/vi/random-lol");
  const res = await app.fetch(req, {}, {});

  console.log("STATUS:", res.status);
  console.log("LOCATION:", res.headers.get("location"));
  console.log("CONTENT-TYPE:", res.headers.get("content-type"));

  const html = await res.text();

  console.log("HTML LENGTH:", html.length);

  if (!html.trim()) {
    throw new Error(
      `Generated HTML is empty. status=${res.status}, location=${res.headers.get("location")}`,
    );
  }

  fs.writeFileSync("dist/client/index.html", html);

  console.log("SPA index.html generated successfully.");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});

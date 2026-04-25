const { spawn } = require("child_process");

const port = process.env.PORT || 3000;

// Step 1: Build
const build = spawn("node", ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
});

build.on("close", (code) => {
  if (code !== 0) {
    console.error("Build failed");
    process.exit(1);
  }

  // Step 2: Start server
  spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", port],
    {
      stdio: "inherit",
    }
  );
});
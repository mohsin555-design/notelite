const { exec } = require("child_process");

const port = process.env.PORT || 3000;

const child = exec(`npx next start -p ${port}`);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
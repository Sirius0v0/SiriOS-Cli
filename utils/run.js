const spawn = require("cross-spawn");

module.exports = function run(options) {
    const cwd = options.cwd || process.cwd();
    const command = "npm";
    const args = ["run", "main"];
    const child = spawn(command, args, { cwd, stdio: ["pipe", process.stdout, process.stderr] });
};
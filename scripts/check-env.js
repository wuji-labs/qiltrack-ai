#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function print(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function printBox(title) {
  print(`\n${"━".repeat(50)}`, "cyan");
  print(`${title}`, "cyan");
  print(`${"━".repeat(50)}\n`, "cyan");
}

function getVersion(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim().split("\n")[0];
  } catch {
    return null;
  }
}

function compareVersions(current, minimum) {
  if (!current) return false;
  const parseVersion = (v) => {
    // Extract version numbers, removing any non-numeric prefixes
    const match = v.match(/(\d+\.\d+\.\d+)/);
    if (match) {
      v = match[1];
    }
    return v
      .split(".")
      .map((x) => parseInt(x) || 0)
      .slice(0, 3);
  };
  const current_arr = parseVersion(current);
  const minimum_arr = parseVersion(minimum);

  for (let i = 0; i < 3; i++) {
    if ((current_arr[i] || 0) > (minimum_arr[i] || 0)) return true;
    if ((current_arr[i] || 0) < (minimum_arr[i] || 0)) return false;
  }
  return true;
}

function checkCommand(name, command, minimum, optional = false) {
  const version = getVersion(command);
  if (!version) {
    if (optional) {
      print(`  ⊙ ${name}: 未安装 (可选)`, "yellow");
    } else {
      print(`  ✗ ${name}: 未安装 (必需!)`, "red");
    }
    return false;
  }

  const ok = compareVersions(version, minimum);
  if (ok) {
    print(
      `  ✓ ${name}: ${version} (需求: >=${minimum})`,
      "green"
    );
  } else {
    print(
      `  ✗ ${name}: ${version} (需求: >=${minimum})`,
      "red"
    );
  }
  return ok;
}

function checkFile(filePath, name = "") {
  const fullPath = path.resolve(filePath);
  const displayName = name || path.basename(filePath);
  if (fs.existsSync(fullPath)) {
    print(`  ✓ ${displayName}`, "green");
    return true;
  } else {
    print(`  ✗ ${displayName} 缺失`, "red");
    return false;
  }
}

function checkSSH() {
  try {
    execSync("ssh -T git@github.com 2>&1", { encoding: "utf-8" });
    print(`  ✓ SSH 密钥已配置`, "green");
    return true;
  } catch (e) {
    const output = e.toString();
    if (output.includes("successfully authenticated")) {
      print(`  ✓ SSH 密钥已配置`, "green");
      return true;
    }
    print(`  ✗ SSH 连接失败，请检查配置`, "red");
    return false;
  }
}

function checkGitConfig() {
  try {
    const name = execSync("git config user.name", { encoding: "utf-8" }).trim();
    const email = execSync("git config user.email", {
      encoding: "utf-8",
    }).trim();
    if (name && email) {
      print(`  ✓ Git 用户: ${name} <${email}>`, "green");
      return true;
    } else {
      print(`  ✗ Git 用户名或邮箱未配置`, "red");
      return false;
    }
  } catch {
    print(`  ✗ 无法读取 Git 配置`, "red");
    return false;
  }
}

function checkNpmDependencies() {
  const packageJsonPath = path.resolve("package.json");
  if (!fs.existsSync(packageJsonPath)) {
    print(`  ✗ package.json 不存在`, "red");
    return false;
  }

  const nodeModulesPath = path.resolve("node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    print(
      `  ⚠ node_modules 目录不存在，请运行 npm install`,
      "yellow"
    );
    return false;
  }

  // 检查核心依赖
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const deps = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ];

  if (deps.length > 0) {
    print(`  ✓ npm 依赖已安装 (${deps.length} 个包)`, "green");
    return true;
  } else {
    print(`  ✗ 无法读取依赖信息`, "red");
    return false;
  }
}

function main() {
  print("\n", "cyan");
  printBox("✓ Investor-AI 开发环境检查");

  let allPassed = true;

  // 1. Check tools
  print("1. 开发工具版本\n", "bold");
  allPassed &= checkCommand("Node.js", "node --version", "18.0.0", false);
  allPassed &= checkCommand("npm", "npm --version", "8.0.0", false);
  allPassed &= checkCommand("Git", "git --version", "2.40.0", false);

  print("\n2. 可选工具\n", "bold");
  checkCommand("GitHub CLI", "gh --version", "1.12.0", true);
  checkCommand("Python", "python --version", "3.8.0", true);

  // 2. Check Git configuration
  print("\n3. Git 配置\n", "bold");
  allPassed &= checkGitConfig();
  checkSSH();

  // 3. Check project files
  print("\n4. 项目文件\n", "bold");
  allPassed &= checkFile("package.json", "package.json");
  allPassed &= checkFile(".git", ".git (版本控制)");
  checkFile(".env.local", ".env.local (环境变量)");

  // 4. Check npm dependencies
  print("\n5. npm 依赖\n", "bold");
  allPassed &= checkNpmDependencies();

  // Summary
  printBox(allPassed ? "✅ 环境检查完毕 - 所有检查通过！" : "❌ 环境检查失败 - 请解决上述问题");

  if (allPassed) {
    print("你的开发环境已准备好。可以开始以下操作:\n", "green");
    print('  npm run dev      # 启动开发服务器', "green");
    print('  npm run lint     # 代码质量检查', "green");
    print('  npm test         # 运行单元测试', "green");
    print('  npm run build    # 生成生产构建\n', "green");
  } else {
    print("\n请根据上述错误信息修复问题。详细说明见 ENVIRONMENT.md", "red");
    process.exit(1);
  }
}

main();

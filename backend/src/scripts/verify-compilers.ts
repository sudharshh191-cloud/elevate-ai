import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function testCompilers() {
  console.log('--- TESTING HOST COMPILERS & RUNTIMES ---');

  // 1. Python
  const py = spawnSync('python', ['-c', 'print("Python 3 OK: " + str(21 * 2))'], { encoding: 'utf8' });
  console.log('Python test:', py.status === 0 ? '✅ PASSED' : '❌ FAILED', py.stdout?.trim() || py.stderr?.trim());

  // 2. Node.js (JavaScript)
  const node = spawnSync('node', ['-e', 'console.log("Node.js JS OK: " + (21 * 2))'], { encoding: 'utf8' });
  console.log('Node.js JS test:', node.status === 0 ? '✅ PASSED' : '❌ FAILED', node.stdout?.trim() || node.stderr?.trim());

  // 3. Java (javac & java)
  const javaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'java_test_'));
  const javaSrc = path.join(javaDir, 'Solution.java');
  fs.writeFileSync(javaSrc, 'public class Solution { public static void main(String[] args) { System.out.println("Java OK: 42"); } }');
  const javac = spawnSync('javac', [javaSrc], { cwd: javaDir, encoding: 'utf8' });
  console.log('Java compile test:', javac.status === 0 ? '✅ PASSED' : '❌ FAILED', javac.stderr?.trim());
  if (javac.status === 0) {
    const javaRun = spawnSync('java', ['-cp', javaDir, 'Solution'], { cwd: javaDir, encoding: 'utf8' });
    console.log('Java run test:', javaRun.status === 0 ? '✅ PASSED' : '❌ FAILED', javaRun.stdout?.trim() || javaRun.stderr?.trim());
  }
  fs.rmSync(javaDir, { recursive: true, force: true });

  // 4. C++ (g++)
  const gppPath = fs.existsSync('C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\g++.exe')
    ? 'C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\g++.exe'
    : 'g++';
  const cppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp_test_'));
  const cppSrc = path.join(cppDir, 'solution.cpp');
  const cppExe = path.join(cppDir, 'solution.exe');
  fs.writeFileSync(cppSrc, '#include <iostream>\nint main() { std::cout << "C++ OK: 42" << std::endl; return 0; }');
  const cppCompile = spawnSync(gppPath, ['-O2', cppSrc, '-o', cppExe], { cwd: cppDir, encoding: 'utf8' });
  console.log('C++ compile test:', cppCompile.status === 0 ? '✅ PASSED' : '❌ FAILED', cppCompile.stderr?.trim());
  if (cppCompile.status === 0) {
    const cppRun = spawnSync(cppExe, [], { cwd: cppDir, encoding: 'utf8' });
    console.log('C++ run test:', cppRun.status === 0 ? '✅ PASSED' : '❌ FAILED', cppRun.stdout?.trim() || cppRun.stderr?.trim());
  }
  fs.rmSync(cppDir, { recursive: true, force: true });

  // 5. C (gcc)
  const gccPath = fs.existsSync('C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\gcc.exe')
    ? 'C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\gcc.exe'
    : 'gcc';
  const cDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c_test_'));
  const cSrc = path.join(cDir, 'solution.c');
  const cExe = path.join(cDir, 'solution.exe');
  fs.writeFileSync(cSrc, '#include <stdio.h>\nint main() { printf("C OK: 42\\n"); return 0; }');
  const cCompile = spawnSync(gccPath, ['-O2', cSrc, '-o', cExe], { cwd: cDir, encoding: 'utf8' });
  console.log('C compile test:', cCompile.status === 0 ? '✅ PASSED' : '❌ FAILED', cCompile.stderr?.trim());
  if (cCompile.status === 0) {
    const cRun = spawnSync(cExe, [], { cwd: cDir, encoding: 'utf8' });
    console.log('C run test:', cRun.status === 0 ? '✅ PASSED' : '❌ FAILED', cRun.stdout?.trim() || cRun.stderr?.trim());
  }
  fs.rmSync(cDir, { recursive: true, force: true });
}

testCompilers();

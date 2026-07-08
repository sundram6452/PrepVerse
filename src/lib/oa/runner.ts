// Lightweight JS/TS code runner that executes user code inside an isolated Worker.
// Other languages are executed via the `oa-run` edge function (Piston-backed sandbox).

import { supabase } from "@/integrations/supabase/client";

export type RunResult = {
  status: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | "compile_error" | "pending";
  runtimeMs: number;
  memoryKb: number | null;
  stderr?: string;
  results: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    runtimeMs: number;
  }>;
};

const WORKER_SRC = `
self.onmessage = async (e) => {
  const { code, input } = e.data;
  const logs = [];
  const origLog = console.log;
  console.log = (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
  const start = performance.now();
  try {
    // Provide \`input\` (string) and \`readLine\` helper. Result = console.log output, or last expression.
    const lines = String(input ?? '').split('\\n');
    let li = 0;
    const readLine = () => lines[li++] ?? '';
    const fn = new Function('input', 'readLine', 'console', code + '\\n;return null;');
    const ret = fn(input, readLine, console);
    const runtimeMs = performance.now() - start;
    let out = logs.join('\\n').trim();
    if (!out && ret != null) out = String(ret).trim();
    self.postMessage({ ok: true, out, runtimeMs });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err && err.stack || err), runtimeMs: performance.now() - start });
  }
};
`;

function runOnce(code: string, input: string, timeoutMs: number) {
  return new Promise<{ ok: boolean; out?: string; error?: string; runtimeMs: number; timedOut?: boolean }>((resolve) => {
    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const w = new Worker(url);
    const t = setTimeout(() => {
      w.terminate();
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Time limit exceeded", runtimeMs: timeoutMs, timedOut: true });
    }, timeoutMs);
    w.onmessage = (e) => {
      clearTimeout(t);
      w.terminate();
      URL.revokeObjectURL(url);
      resolve(e.data);
    };
    w.postMessage({ code, input });
  });
}

export async function runJsTests(
  code: string,
  tests: Array<{ input: string; expected_output?: string; output?: string }>,
  timeLimitMs: number,
): Promise<RunResult> {
  const results: RunResult["results"] = [];
  let totalMs = 0;
  let status: RunResult["status"] = "accepted";
  let stderr = "";

  for (const t of tests) {
    const expected = String(t.expected_output ?? t.output ?? "").trim();
    const r = await runOnce(code, t.input ?? "", timeLimitMs);
    totalMs += r.runtimeMs;
    if (r.timedOut) {
      status = "time_limit_exceeded";
      results.push({ input: t.input ?? "", expected, actual: "", passed: false, runtimeMs: r.runtimeMs });
      break;
    }
    if (!r.ok) {
      status = "runtime_error";
      stderr = r.error ?? "";
      results.push({ input: t.input ?? "", expected, actual: "", passed: false, runtimeMs: r.runtimeMs });
      break;
    }
    const actual = (r.out ?? "").trim();
    const passed = actual === expected;
    if (!passed && status === "accepted") status = "wrong_answer";
    results.push({ input: t.input ?? "", expected, actual, passed, runtimeMs: r.runtimeMs });
  }

  return { status, runtimeMs: Math.round(totalMs), memoryKb: null, stderr, results };
}

export async function runRemoteTests(
  language: string,
  code: string,
  tests: Array<{ input: string; expected_output?: string; output?: string }>,
  timeLimitMs: number,
): Promise<RunResult> {
  const { data, error } = await supabase.functions.invoke("oa-run", {
    body: { language, code, tests, timeLimitMs },
  });
  if (error) {
    return {
      status: "runtime_error",
      runtimeMs: 0,
      memoryKb: null,
      stderr: error.message ?? "Remote judge unavailable",
      results: [],
    };
  }
  if ((data as any)?.error) {
    return {
      status: "runtime_error",
      runtimeMs: 0,
      memoryKb: null,
      stderr: (data as any).error,
      results: [],
    };
  }
  return data as RunResult;
}

export async function runTests(
  language: string,
  code: string,
  tests: Array<{ input: string; expected_output?: string; output?: string }>,
  timeLimitMs: number,
): Promise<RunResult> {
  if (language === "javascript") return runJsTests(code, tests, timeLimitMs);
  return runRemoteTests(language, code, tests, timeLimitMs);
}

export const LANGUAGES: { value: string; label: string; monaco: string; runnable: boolean }[] = [
  { value: "javascript", label: "JavaScript", monaco: "javascript", runnable: true },
  { value: "typescript", label: "TypeScript", monaco: "typescript", runnable: true },
  { value: "python", label: "Python", monaco: "python", runnable: true },
  { value: "java", label: "Java", monaco: "java", runnable: true },
  { value: "cpp", label: "C++", monaco: "cpp", runnable: true },
  { value: "c", label: "C", monaco: "c", runnable: true },
  { value: "go", label: "Go", monaco: "go", runnable: true },
  { value: "rust", label: "Rust", monaco: "rust", runnable: true },
];

export const DEFAULT_STARTERS: Record<string, string> = {
  javascript: `// Read input via readLine() or use the \`input\` string.\n// Print output via console.log().\n\nconst n = Number(readLine());\nconsole.log(n * 2);\n`,
  typescript: `// TypeScript starter\nconst n: number = Number(readLine());\nconsole.log(n * 2);\n`,
  python: `# Read stdin, print to stdout.\nimport sys\nn = int(sys.stdin.readline())\nprint(n * 2)\n`,
  java: `import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    System.out.println(n * 2);\n  }\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  cout << n * 2 << endl;\n  return 0;\n}\n`,
  c: `#include <stdio.h>\nint main(){ int n; scanf("%d", &n); printf("%d\\n", n*2); return 0; }\n`,
  go: `package main\nimport "fmt"\nfunc main(){ var n int; fmt.Scan(&n); fmt.Println(n*2) }\n`,
  rust: `use std::io::{self, BufRead};\nfn main(){\n  let stdin = io::stdin();\n  let line = stdin.lock().lines().next().unwrap().unwrap();\n  let n: i64 = line.trim().parse().unwrap();\n  println!("{}", n * 2);\n}\n`,
};
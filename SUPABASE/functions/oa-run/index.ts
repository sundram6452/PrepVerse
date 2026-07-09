import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Test = { input?: string; expected_output?: string; output?: string };

// Judge0 CE public instance (free, no key). https://ce.judge0.com
const LANGUAGE_ID: Record<string, number> = {
  python: 71,      // Python 3.8.1
  cpp: 54,         // C++ (GCC 9.2.0)
  c: 50,           // C (GCC 9.2.0)
  java: 62,        // Java (OpenJDK 13.0.1)
  go: 60,          // Go 1.13.5
  rust: 73,        // Rust 1.40.0
  typescript: 74,  // TypeScript 3.7.4
};

async function judge0Run(languageId: number, code: string, stdin: string, timeLimitMs: number) {
  const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: languageId,
      source_code: code,
      stdin,
      cpu_time_limit: Math.max(1, Math.round((timeLimitMs ?? 5000) / 1000)),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Judge0 ${res.status}: ${t.slice(0, 200)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { language, code, tests, timeLimitMs } = await req.json();
    const languageId = LANGUAGE_ID[language];
    if (!languageId) {
      return new Response(JSON.stringify({ error: `Unsupported language: ${language}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(tests) || tests.length === 0) {
      return new Response(JSON.stringify({ error: 'No tests provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    let status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'compile_error' = 'accepted';
    let stderr = '';
    let totalMs = 0;

    for (const t of tests as Test[]) {
      const expected = String(t.expected_output ?? t.output ?? '').trim();
      const input = t.input ?? '';
      const start = Date.now();
      let out: any;
      try {
        out = await judge0Run(languageId, code, input, timeLimitMs);
      } catch (err) {
        status = 'runtime_error';
        stderr = String((err as Error).message);
        results.push({ input, expected, actual: '', passed: false, runtimeMs: Date.now() - start });
        break;
      }
      const runtimeMs = Date.now() - start;
      totalMs += runtimeMs;

      // Judge0 status IDs: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compile Error, 7-12=Runtime Error
      const statusId = out?.status?.id;
      if (statusId === 6) {
        status = 'compile_error';
        stderr = String(out.compile_output || out.message || '');
        results.push({ input, expected, actual: '', passed: false, runtimeMs });
        break;
      }
      if (statusId === 5) {
        status = 'time_limit_exceeded';
        results.push({ input, expected, actual: '', passed: false, runtimeMs });
        break;
      }
      if (statusId >= 7 && statusId <= 12) {
        status = 'runtime_error';
        stderr = String(out.stderr || out.message || out.status?.description || 'Runtime error');
        results.push({ input, expected, actual: '', passed: false, runtimeMs });
        break;
      }
      const actual = String(out.stdout ?? '').replace(/\r\n/g, '\n').trim();
      const passed = actual === expected;
      if (!passed && status === 'accepted') status = 'wrong_answer';
      results.push({ input, expected, actual, passed, runtimeMs });
    }

    return new Response(
      JSON.stringify({ status, runtimeMs: totalMs, memoryKb: null, stderr, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
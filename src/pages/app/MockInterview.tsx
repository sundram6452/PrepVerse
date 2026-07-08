import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, Sparkles, RotateCcw, User as UserIcon, Briefcase, Mic, MicOff, Volume2, VolumeX, Video, VideoOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const PRESET_ROLES = [
  "Frontend Engineer Intern",
  "Backend Engineer Intern",
  "Full-Stack Engineer",
  "SDE-1 (New Grad)",
  "Data Scientist Intern",
  "ML Engineer",
  "Android Developer",
  "DevOps / SRE",
  "Product Manager",
  "Custom",
];

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Startup", "Any"];
const LEVELS = ["Intern", "New Grad", "SDE-1", "SDE-2", "Senior"];
const FOCUS = ["DSA + Behavioral", "System Design", "Frontend (JS/React)", "Backend + DB", "ML / DS", "HR / Behavioral only"];

export default function MockInterview() {
  const [started, setStarted] = useState(false);
  const [role, setRole] = useState("Frontend Engineer Intern");
  const [customRole, setCustomRole] = useState("");
  const [company, setCompany] = useState("Google");
  const [level, setLevel] = useState("Intern");
  const [focus, setFocus] = useState("DSA + Behavioral");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      cameraStreamRef.current = s;
      setCameraOn(true);
      // wait a tick so <video> mounts
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (e: any) {
      toast.error(e?.message ?? "Camera access denied");
    }
  };

  useEffect(() => () => { stopCamera(); }, []);

  const effectiveRole = role === "Custom" ? customRole.trim() || "Software Engineer" : role;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
  };

  const speak = async (text: string) => {
    if (!voiceOn || !text.trim()) return;
    try {
      stopAudio();
      setSpeaking(true);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setSpeaking(false); return; }
      const blob = await res.blob();
      const src = URL.createObjectURL(blob);
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(src); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(src); };
      await audio.play().catch(() => setSpeaking(false));
    } catch {
      setSpeaking(false);
    }
  };

  // Strip markdown for cleaner speech
  const cleanForSpeech = (md: string) =>
    md
      .replace(/```[\s\S]*?```/g, " code block omitted ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#>~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  const stream = async (nextMessages: Msg[]) => {
    setLoading(true);
    stopAudio();
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: nextMessages,
          role: effectiveRole,
          company,
          level,
          focus,
        }),
      });

      if (res.status === 429) { toast.error("Rate limit reached, try again shortly"); return; }
      if (res.status === 402) { toast.error("AI credits exhausted"); return; }
      if (!res.ok || !res.body) { toast.error("Interview request failed"); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
      if (assistant.trim()) {
        speak(cleanForSpeech(assistant));
      }
    } catch (e: any) {
      toast.error(e.message ?? "Interview request failed");
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (role === "Custom" && !customRole.trim()) {
      toast.error("Enter a custom role");
      return;
    }
    setStarted(true);
    setMessages([]);
    await stream([
      { role: "user", content: `Please start the mock interview now for the role of ${effectiveRole} at a ${company} style company. Level: ${level}. Focus: ${focus}. Begin with a brief greeting and your first question.` },
    ]);
  };

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    await stream(next);
  };

  const reset = () => {
    stopAudio();
    stopCamera();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setStarted(false);
    setMessages([]);
    setInput("");
  };

  const startRecording = async () => {
    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      mimeRef.current = mime || "audio/webm";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const b64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => {
              const s = String(r.result || "");
              resolve(s.split(",")[1] ?? "");
            };
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stt`;
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ audio: b64, mimeType: mimeRef.current }),
          });
          if (!res.ok) { toast.error("Transcription failed"); return; }
          const json = await res.json();
          const text = (json.text ?? "").trim();
          if (text) setInput((prev) => (prev ? prev + " " + text : text));
        } catch (e: any) {
          toast.error(e.message ?? "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e: any) {
      toast.error(e.message ?? "Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Mock Interview</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Practice a realistic interview with an AI interviewer. Pick a role, get grilled with follow-ups, and receive a scored report at the end.
        </p>
      </motion.div>

      {!started ? (
        <div className="glass-strong rounded-2xl p-6 md:p-8 max-w-3xl">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Role you're interviewing for</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESET_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {role === "Custom" && (
                <Input
                  placeholder="e.g. Blockchain Engineer, iOS Developer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Company style</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Focus</Label>
              <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOCUS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={startInterview} className="mt-6 gradient-primary text-primary-foreground shadow-glow">
            <Bot className="h-4 w-4 mr-2" /> Start interview
          </Button>
        </div>
      ) : (
        <div className="relative glass-strong rounded-2xl flex flex-col h-[calc(100vh-14rem)] min-h-[520px] overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{effectiveRole}</p>
                <p className="text-[11px] text-muted-foreground truncate">{company} · {level} · {focus}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={cameraOn ? "default" : "outline"}
                size="sm"
                onClick={() => (cameraOn ? stopCamera() : startCamera())}
                title={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {cameraOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { if (voiceOn) stopAudio(); setVoiceOn((v) => !v); }}
                title={voiceOn ? "Mute interviewer voice" : "Unmute interviewer voice"}
              >
                {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New</Button>
            </div>
          </div>

          {cameraOn && (
            <div className="absolute bottom-24 right-6 z-20 w-48 md:w-56 rounded-xl overflow-hidden border border-border shadow-glow bg-black">
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/60"
                )}>
                  <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-background/60 prose-pre:text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start gap-3">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-secondary/60 rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t border-border flex gap-2 items-end"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={recording ? "Listening… tap mic to stop" : "Type or tap the mic to speak your answer"}
              rows={1}
              className="resize-none min-h-10 max-h-40"
              disabled={loading}
            />
            <Button
              type="button"
              size="icon"
              variant={recording ? "destructive" : "outline"}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading || transcribing}
              title={recording ? "Stop recording" : "Speak your answer"}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={async () => {
              const next: Msg[] = [...messages, { role: "user", content: "End interview. Please give me the final report now." }];
              setMessages(next);
              await stream(next);
            }}>End & Report</Button>
          </form>
        </div>
      )}
    </div>
  );
}
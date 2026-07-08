import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Code2, MessageSquareText, CalendarDays, Sparkles, Trophy, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: MessageSquareText, title: "Interview Experiences", desc: "Real interview rounds, questions, and tips from peers — searchable by company, role, and difficulty." },
  { icon: Code2, title: "OA Questions", desc: "Practice online assessments in a Monaco editor with run, submit, and complexity analysis." },
  { icon: Building2, title: "Company Hub", desc: "Hiring patterns, salary, eligibility, OA + interview history for every top recruiter." },
  { icon: Sparkles, title: "AI Assistant", desc: "Gemini-powered explanations, dry runs, mock interviews, roadmaps, and resume review." },
  { icon: CalendarDays, title: "OA Calendar", desc: "Never miss an OA, hackathon, or placement drive with deadlines and registration links." },
  { icon: Users, title: "Discussion Forum", desc: "DSA, referrals, mock interviews, resume help — upvote, reply, share." },
];

const stats = [
  { value: "2.5K+", label: "Interview Experiences" },
  { value: "1.8K+", label: "OA Questions" },
  { value: "400+", label: "Companies" },
  { value: "12K+", label: "Active Students" },
];

const Landing = () => {
  const { user } = useAuth();
  const ctaTo = user ? "/app" : "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#stats" className="hover:text-foreground transition">Community</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to={ctaTo}>
              <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90 shadow-neon">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>AI-powered placement prep, built for 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto"
          >
            Crack placements.{" "}
            <span className="gradient-text">Together.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Real interview experiences, OA questions in a live editor, company playbooks, and an AI mentor — everything you need to land your dream offer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={ctaTo}>
              <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow gap-2 px-8">
                Start preparing free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="glass border-border gap-2 px-8">
                <BookOpen className="h-4 w-4" /> Explore features
              </Button>
            </a>
          </motion.div>

          {/* Stat ribbon */}
          <motion.div
            id="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6">
                <div className="font-display text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Everything you need, <span className="gradient-text">in one place</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              A unified platform replacing scattered Google Docs, WhatsApp groups, and forum threads.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass rounded-2xl p-6 group hover:shadow-glow transition-all"
              >
                <div className="h-12 w-12 rounded-xl gradient-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-16">
            From <span className="gradient-text">prep</span> to <span className="gradient-text">placed</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Discover", desc: "Search companies, interview experiences, and OA papers by role, batch, or difficulty." },
              { step: "02", title: "Practice", desc: "Solve OAs in our Monaco editor, get AI hints, and review complexity analysis." },
              { step: "03", title: "Share & climb", desc: "Post your own experiences, earn badges, top the leaderboard, and pay it forward." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-display text-6xl font-bold gradient-text opacity-30 mb-4">{s.step}</div>
                <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-glow opacity-50" />
          <div className="relative">
            <Trophy className="h-12 w-12 mx-auto text-accent mb-6 animate-glow-pulse" />
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Your offer letter starts <span className="gradient-text">here</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join thousands of students prepping smarter, not harder.
            </p>
            <Link to={ctaTo}>
              <Button size="lg" className="mt-8 gradient-primary text-primary-foreground hover:opacity-90 shadow-glow gap-2 px-10">
                Create your free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <p>© 2026 PrepArena. Built for the next generation of engineers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
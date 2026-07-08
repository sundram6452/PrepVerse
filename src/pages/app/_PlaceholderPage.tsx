import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  phase: string;
  features: string[];
}

export const PlaceholderPage = ({ title, description, phase, features }: Props) => (
  <div className="space-y-8">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <p className="text-sm text-muted-foreground">{phase}</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
    </motion.div>

    <div className="glass-strong rounded-2xl p-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 gradient-glow opacity-30" />
      <div className="relative max-w-lg mx-auto">
        <div className="h-16 w-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-glow mb-6">
          <Construction className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2">Shipping in {phase}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This module is part of our phased rollout. Here's what it will include:
        </p>
        <ul className="text-left space-y-2 mb-6">
          {features.map((f) => (
            <li key={f} className="text-sm flex items-start gap-2">
              <span className="text-accent mt-1">▸</span>
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <Link to="/app">
          <Button variant="outline" className="glass">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  </div>
);
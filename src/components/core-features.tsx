"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Bot, Layers, LineChart } from "lucide-react";

const blocks = [
  {
    icon: Sparkles,
    title: "AI Content Engine",
    bullets: [
      "Platform-specific writing",
      "Hashtags & tone control",
      "Brand-aligned messaging",
    ],
    color: "from-amber-500/10 to-orange-500/10",
  },
  {
    icon: Bot,
    title: "Automation & Autopilot",
    bullets: ["Smart Auto Mode", "Zero approvals", "Continuous posting"],
    color: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: Layers,
    title: "Multi-Platform Scale",
    bullets: ["Instagram, LinkedIn, X, Facebook", "Multi-brand support", "Unified control"],
    color: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: LineChart,
    title: "Analytics & Learning",
    bullets: ["Engagement tracking", "AI feedback loop", "Performance insights"],
    color: "from-emerald-500/10 to-teal-500/10",
  },
];

function FeatureCard({
  block,
  index,
}: {
  block: (typeof blocks)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        style={{ y }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.3 }}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"
      >
        {/* Background gradient */}
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${block.color} opacity-0 transition-opacity group-hover:opacity-100`}
        />

        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/15 p-3 transition-colors group-hover:bg-primary/20">
            <block.icon className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight">{block.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {block.bullets.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span className="leading-relaxed">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-border/60" />

        <p className="mt-4 text-xs text-muted-foreground">Built for quiet reliability.</p>
      </motion.div>
    </motion.div>
  );
}

export function CoreFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0.6, 1]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-border">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-secondary/15 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">Core features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl"
          >
            Everything needed for a{" "}
            <span className="relative">
              <span className="relative z-10">self-running</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-primary/20" />
            </span>{" "}
            social presence.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-muted-foreground"
          >
            Four capabilities, intentionally focused. No cluttered dashboards. No “click to
            generate” workflows.
          </motion.p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {blocks.map((block, index) => (
            <FeatureCard key={block.title} block={block} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
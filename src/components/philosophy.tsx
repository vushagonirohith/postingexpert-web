"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.8]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-border">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/12 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <motion.div style={{ y, opacity }} className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">Product philosophy</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
          >
            Marketing should run in the{" "}
            <span className="relative">
              <span className="relative z-10">background</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-primary/20" />
            </span>{" "}
            —
            <br className="hidden md:block" />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative ml-0 md:ml-2 inline-block"
            >
              not consume your day.
              <span className="absolute -bottom-2 left-0 h-[6px] w-full rounded-full bg-primary/25" />
            </motion.span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            PostingExpert is built for calm confidence. You set direction once, and the system
            handles consistency, publishing, and improvement — quietly and reliably.
          </motion.p>

          {/* Decorative stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-8"
          >
            {[
              { value: "10+", label: "Hours saved weekly" },
              { value: "4", label: "Platforms supported" },
              { value: "∞", label: "Content variations" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-3xl font-bold text-primary">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
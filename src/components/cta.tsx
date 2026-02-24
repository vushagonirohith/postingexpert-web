"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.98]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-border">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-secondary/20 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <motion.div
          style={{ y, scale }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 shadow-2xl md:p-16"
        >
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Ready to automate?</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
            >
              Start automating your{" "}
              <span className="relative">
                <span className="relative z-10">social media</span>
                <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-primary/20" />
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-lg text-muted-foreground"
            >
              Let AI run it — while you build your business.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/how-it-works"
                className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:shadow-md"
              >
                See how it works
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-xs text-muted-foreground"
            >
              No clutter. No micromanagement. Just consistent output.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { TrendingUp, Clock, Zap, Shield } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Subtle parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
        {/* Left - Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: y1, opacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Silent automation for social media
            </span>
          </motion.div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Your Social Media,{" "}
            <span className="relative">
              <span className="relative z-10">Fully Automated</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-primary/20" />
            </span>
            .
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            PostingExpert creates, posts, and improves — in the background.
            No micromanagement. No daily posting effort.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="group relative overflow-hidden rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:shadow-md"
            >
              See how it works
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            {[
              { icon: Clock, text: "Runs 24×7" },
              { icon: Shield, text: "Zero approvals" },
              { icon: TrendingUp, text: "Learns & improves" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-3 w-3 text-primary" />
                </span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right - Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ y: y2 }}
          className="relative"
        >
          {/* Main dashboard image */}
          <div className="relative">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
            >
              <Image
                src="/images/dashboard.png"
                alt="PostingExpert Dashboard"
                width={600}
                height={400}
                className="w-full"
                priority
              />
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </motion.div>

            {/* Floating micro-card 1 - Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -left-4 top-1/4 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+24%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating micro-card 2 - Live status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -right-4 top-1/3 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auto Mode</p>
                    <p className="text-sm font-semibold text-primary">Active</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating micro-card 3 - Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="absolute -bottom-4 left-1/4 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="rounded-xl border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["IG", "LI", "FB"].map((platform, i) => (
                      <div
                        key={platform}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground"
                        style={{ zIndex: 4 - i }}
                      >
                        {platform}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">3 platforms connected</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Soft glow behind image */}
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/10 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
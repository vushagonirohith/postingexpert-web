"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Connect your accounts",
    desc: "Link Instagram, LinkedIn, X, and Facebook in seconds. Our secure OAuth integration ensures your data stays protected while enabling seamless cross-platform posting.",
    image: "/images/step-connect.png",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    number: "02",
    title: "Define your brand voice",
    desc: "Set your tone, style, and content preferences once. The AI learns your brand personality and creates content that sounds authentically like you.",
    image: "/images/step-brand.png",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    number: "03",
    title: "Enable Autopilot",
    desc: "Flip the switch and watch your social presence grow. AI creates, schedules, and posts content automatically — learning and improving with every interaction.",
    image: "/images/step-autopilot.png",
    color: "from-emerald-500/20 to-teal-500/20",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.95]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={cardRef}
      style={{ opacity, scale }}
      className="relative"
    >
      <div
        className={`grid grid-cols-1 gap-8 items-center lg:grid-cols-2 lg:gap-16 ${
          isEven ? "" : "lg:flex-row-reverse"
        }`}
      >
        {/* Image */}
        <motion.div
          style={{ y }}
          className={`relative ${isEven ? "lg:order-1" : "lg:order-2"}`}
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-50`} />
            <Image
              src={step.image}
              alt={step.title}
              width={500}
              height={375}
              className="relative z-10 w-full"
            />
          </motion.div>

          {/* Step number badge */}
          <div
            className={`absolute -top-4 ${
              isEven ? "-right-4 lg:-right-6" : "-left-4 lg:-left-6"
            } flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-lg`}
          >
            <span className="text-xl font-bold text-primary">{step.number}</span>
          </div>

          {/* Soft glow */}
          <div
            className={`pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br ${step.color} blur-2xl opacity-60`}
          />
        </motion.div>

        {/* Content */}
        <div className={`${isEven ? "lg:order-2" : "lg:order-1"}`}>
          <motion.div
            initial={{ opacity: 0, x: isEven ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Step {step.number}</span>
              <div className="h-px w-8 bg-border" />
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
              {step.title}
            </h3>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {step.desc}
            </p>

            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-6 hidden lg:flex items-center gap-2 text-sm text-primary"
              >
                <span>Next step</span>
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [30, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-border">
      {/* Background elements */}
      <div className="pointer-events-none absolute left-0 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 bottom-1/4 -z-10 h-[300px] w-[300px] rounded-full bg-secondary/15 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        {/* Header */}
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">How it works</span>
          </motion.div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Three steps to{" "}
            <span className="relative">
              <span className="relative z-10">automation</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-primary/20" />
            </span>
          </h2>

          <p className="mt-5 text-lg text-muted-foreground">
            No complex setups. No daily management. Just set it once and let AI handle the rest.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-20 space-y-24 md:mt-28 md:space-y-32">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-24 text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-lg">
            <p className="text-lg font-medium">Ready to automate your social media?</p>
            <p className="text-sm text-muted-foreground">
              Join thousands of teams saving hours every week.
            </p>
            <a
              href="/login"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
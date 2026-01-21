"use client";

import { motion, useReducedMotion } from "framer-motion";

const companies = [
  "หอพักสยาม",
  "Metro Residence",
  "Green Dorm",
  "Urban Stay",
  "City Loft",
];

export function LandingSocialProof() {
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: shouldReduceMotion
            ? undefined
            : { staggerChildren: 0.1 },
        },
      }}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-20"
    >
      <div className="text-center space-y-6">
        <motion.p
          variants={fadeUp}
          className="text-sm text-slate-600 sm:text-base"
        >
          Trusted by people from new-born startup to established corporations
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-6 opacity-60"
        >
          {companies.map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, scale: 0.5, y: 20, rotateX: -90 }}
              whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ scale: 1.1, y: -2 }}
              className="text-lg font-semibold text-slate-700"
            >
              {company}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

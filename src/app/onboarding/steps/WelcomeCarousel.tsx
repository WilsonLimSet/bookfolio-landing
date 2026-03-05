"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    title: "Rank",
    description: "Build your personal book ranking",
    icon: (
      <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ),
  },
  {
    title: "Discover",
    description: "Get recommendations from readers you trust",
    icon: (
      <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Track",
    description: "Keep track of what you've read and want to read",
    icon: (
      <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

interface WelcomeCarouselProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function WelcomeCarousel({ onGetStarted, onLogin }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = splash
  const [direction, setDirection] = useState(1);

  // Auto-advance from splash after 1.5s
  useEffect(() => {
    if (currentSlide === -1) {
      const timer = setTimeout(() => {
        setDirection(1);
        setCurrentSlide(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  // Splash screen
  if (currentSlide === -1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--onboarding-teal)" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Image src="/logo-512x512.png" alt="Bookfolio" width={80} height={80} className="rounded-2xl" />
          <h1 className="text-4xl font-bold text-white tracking-tight">Bookfolio</h1>
        </motion.div>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--onboarding-teal)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8">
              {slide.icon}
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{slide.title}</h2>
            <p className="text-white/70 text-lg">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 space-y-6">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? "bg-white w-6" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        <button
          onClick={onGetStarted}
          className="w-full py-4 rounded-full text-lg font-semibold transition-colors"
          style={{ background: "var(--onboarding-accent)", color: "white" }}
        >
          Get started
        </button>

        <button
          onClick={onLogin}
          className="w-full text-center text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}

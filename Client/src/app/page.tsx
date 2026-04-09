'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";

const heroSlides = [
  {
    label: "WELCOME TO",
    title: "NEW MANKAMANA\nPRINTERS",
    subtitle:
      "We're Rededicated for development of printing Industry through Innovation and excellence.",
    // Deep royal blue gradient like the design reference
    background:
      "linear-gradient(135deg, #0b1f4b 0%, #123c97 30%, #1b63e0 60%, #0f172a 100%)",
  },
  {
    label: "PREMIUM QUALITY",
    title: "B2B PRINTING\nSOLUTIONS",
    subtitle:
      "From visiting cards to garment tags — all your corporate printing needs under one roof.",
    // Slightly lighter blue with a hint of violet
    background:
      "linear-gradient(135deg, #0f172a 0%, #1d3fb8 35%, #2563eb 70%, #38bdf8 100%)",
  },
  {
    label: "WHOLESALE RATES",
    title: "PRINT AT\nBEST PRICES",
    subtitle:
      "Get the best prices in the industry directly from the source with guaranteed quality.",
    // Blue-to-cyan variant for price-focused messaging
    background:
      "linear-gradient(135deg, #020617 0%, #1e3a8a 25%, #0369a1 60%, #0ea5e9 100%)",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Register",
    desc: "Sign up with your company details. Admin will review and send your login credentials via email.",
  },
  {
    step: "02",
    title: "Choose or Design",
    desc: "Browse free templates or upload your custom design files to get started.",
  },
  {
    step: "03",
    title: "Place Order",
    desc: "Configure your order — quantity, paper type, finish — and submit with proof of payment.",
  },
  {
    step: "04",
    title: "Receive Delivery",
    desc: "Track your order status in real-time and receive your prints at your doorstep.",
  },
];

export default function HomePage() {

  //zustand store
  const {isAuthenticated} = useAuthStore()

  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section
        className="relative overflow-hidden min-h-[350px] md:min-h-[480px]"
        style={{ background: heroSlides[activeSlide].background }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-16 -right-16 w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px] bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 md:left-[30%] md:translate-x-0 w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] bg-white/[0.04] rounded-full pointer-events-none" />

        {/* Slide nav arrows (hide on mobile) */}
        <button
          onClick={() =>
            setActiveSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)
          }
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/15 border-none text-white w-10 h-10 rounded-full text-[1.1rem] cursor-pointer backdrop-blur-sm z-10 items-center justify-center"
          tabIndex={-1}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          onClick={() =>
            setActiveSlide((p) => (p + 1) % heroSlides.length)
          }
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/15 border-none text-white w-10 h-10 rounded-full text-[1.1rem] cursor-pointer backdrop-blur-sm z-10 items-center justify-center"
          tabIndex={-1}
          aria-label="Next slide"
        >
          ›
        </button>

        <div className="max-w-full sm:max-w-[600px] md:max-w-[900px] mx-auto pt-16 sm:pt-20 px-3 sm:px-5 md:px-8 pb-10 sm:pb-14 text-center relative z-10">
          <p className="text-white/80 text-[0.8rem] font-semibold tracking-[0.19em] uppercase mb-3">
            {heroSlides[activeSlide].label}
          </p>
          <h1 className="text-white text-[clamp(1.4rem,7vw,3.5rem)] font-black tracking-[-0.02em] leading-[1.1] mb-5 whitespace-pre-line shadow-[0_2px_20px_rgba(0,0,0,0.2)]">
            {heroSlides[activeSlide].title}
          </h1>
          <p className="text-white/85 text-base max-w-full sm:max-w-[400px] md:max-w-[500px] mx-auto mb-8 leading-[1.7]">
            {heroSlides[activeSlide].subtitle}
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center flex-wrap">
            <Link href="/services" className="btn-white-outline">
              Our Services
            </Link>
            <Link
              href="/register"
              className="btn-white-outline bg-white/20"
            >
              Learn More
            </Link>
          </div>

          {/* Slider dots (responsive spacing) */}
          <div className="slider-dots mt-6 sm:mt-8 md:mt-10 flex justify-center gap-3">
            {heroSlides.map((_, i) => (
              <div
                key={i}
                className={`slider-dot ${i === activeSlide ? "active" : ""}`}
                onClick={() => setActiveSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services Preview ─── */}
      <section className="py-10 sm:py-16 px-3 sm:px-6 bg-[#f8fafc]">
        <div className="max-w-full sm:max-w-[1200px] mx-auto">
          <div className="section-title flex flex-col items-center justify-center mb-7 sm:mb-10 gap-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Services</h2>
            <div className="divider h-[3px] sm:h-[4px] rounded-full w-12 sm:w-24  bg-blue-500" />
            <p className="max-w-full sm:max-w-1/2 text-center text-[0.95rem]">
              Discover our premium range of printing solutions tailored to
              elevate your business brand and operations.
            </p>
          </div>

          <div className="max-w-full sm:max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
            {/* Printing Services */}
            <div
              className="card overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => router.push('/services')}
            >
              <div className="h-[110px] sm:h-[160px] md:h-[180px] bg-gradient-to-br from-[#ffecd2] to-[#fcb69f] flex items-center justify-center">
                <svg className="w-16 h-16 text-orange-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
              </div>
              <div className="p-4 sm:p-6">
                <span className="bg-[#dcfce7] text-[#16a34a] text-[0.55rem] sm:text-[0.6rem] font-bold px-2 py-0.5 rounded-[50px] tracking-[0.08em] uppercase">
                  MOST POPULAR
                </span>
                <div className="flex gap-1 sm:gap-2 items-center mt-3 text-[color:var(--text-dark)]">
                  <h3 className="font-bold text-[1rem] sm:text-[1.05rem]">
                    Printing Services
                  </h3>
                </div>
                <p className="text-[0.77rem] sm:text-[0.82rem] text-[#64748b] mt-2 leading-[1.6]">
                  Wide range of excellent printing services at low cost
                  with committed turnaround time.
                </p>
                <button
                  onClick={() => router.push('/services')}
                  className="mt-3 sm:mt-4 bg-transparent border-none text-[#1a56db] font-semibold text-[0.8rem] sm:text-[0.82rem] cursor-pointer flex items-center gap-1 p-0 hover:underline"
                >
                  View Products →
                </button>
              </div>
            </div>

            {/* Free Design Files */}
            <div
              className="card overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => router.push('/templates')}
            >
              <div className="h-[110px] sm:h-[160px] md:h-[180px] bg-gradient-to-br from-[#a8edea] to-[#fed6e3] flex items-center justify-center">
                <svg className="w-16 h-16 text-teal-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <div className="p-4 sm:p-6">
                <span className="bg-[#fef9c3] text-[#ca8a04] text-[0.55rem] sm:text-[0.6rem] font-bold px-2 py-0.5 rounded-[50px] tracking-[0.08em] uppercase">
                  FREE RESOURCE
                </span>
                <div className="flex gap-1 sm:gap-2 items-center mt-3 text-[color:var(--text-dark)]">
                  <h3 className="font-bold text-[1rem] sm:text-[1.05rem]">
                    Free Design Files
                  </h3>
                </div>
                <p className="text-[0.77rem] sm:text-[0.82rem] text-[#64748b] mt-2 leading-[1.6]">
                  Access our curated library of free graphic resources.
                  Perfect for print-ready templates.
                </p>
                <button
                  onClick={() => router.push('/templates')}
                  className="mt-3 sm:mt-4 bg-transparent border-none text-[color:var(--gradient-start)] font-semibold text-[0.8rem] sm:text-[0.82rem] cursor-pointer flex items-center gap-1 p-0 hover:underline"
                >
                  Browse Library →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-10 sm:py-16 px-3 sm:px-6 bg-white">
        <div className="max-w-full sm:max-w-[1100px] mx-auto">
          <div className="section-title flex flex-col items-center justify-center mb-7 sm:mb-10 gap-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How It Works</h2>
            <div className="divider h-[3px] sm:h-[4px] rounded-full w-12 sm:w-24 bg-blue-500" />
            <p className="max-w-full sm:max-w-1/2 text-center text-[0.95rem]">
              Get your prints in 4 simple steps — from registration to doorstep
              delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {howItWorks.map((step) => (
              <div
                key={step.step}
                className="text-center shadow-lg rounded-lg p-3 sm:p-4 cursor-pointer hover:scale-105 transition-all bg-white"
              >
                <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[#1a56db] to-[#2563eb] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                  <span className="text-white font-black text-[1rem] sm:text-[1.1rem]">{step.step}</span>
                </div>
                <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#1a56db] tracking-[0.1em] mb-1.5">
                  STEP {step.step}
                </div>
                <h3 className="font-bold text-[1rem] sm:text-base mb-2 text-[color:var(--text-dark)]">
                  {step.title}
                </h3>
                <p className="text-[0.75rem] sm:text-[0.8rem] text-[#64748b] leading-[1.6]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section
        id="contact"
        className="py-10 sm:py-16 px-3 sm:px-6 text-center"
        style={{ background: heroSlides[0].background }}
      >
        <div className="max-w-full sm:max-w-[600px] mx-auto">
          <h2 className="text-white text-[1.35rem] sm:text-[1.7rem] md:text-[2rem] font-black mb-3 sm:mb-4">
            Ready to Start Printing?
          </h2>
          <p className="text-white/85 text-base mb-6 sm:mb-8 leading-[1.7] text-[0.98rem]">
            Register your company today and get access to wholesale
            printing rates, free templates, and dedicated support.
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center flex-wrap">
              {isAuthenticated ? (
                <Link href="/services" className="btn-white-outline bg-white/20">
                  Our Services
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn-white-outline bg-white/20"
                  >
                    Register Now
                  </Link>
                  <Link href="/login" className="btn-white-outline">
                    Login
                  </Link>
                </>
              )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

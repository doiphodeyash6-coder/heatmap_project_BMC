'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import Spotlight from '@/components/Spotlight';
import Particles from '@/components/Particles';

export default function Home() {

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 🌌 BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* 🌑 DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ✨ GOD EFFECTS */}
      <Spotlight />
      <Particles />

      {/* 🔥 MAIN CONTENT */}
      <div className="relative z-10 animate-fadeIn">

        <Navigation />

        {/* HERO */}
        <section className="text-center py-32 px-6 max-w-5xl mx-auto text-white">

          <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
            Smart Waste Management
          </span>

          <h1 className="text-5xl md:text-6xl font-bold mt-6 mb-6 leading-tight">
            Track Waste Issues
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              in Your Community
            </span>
          </h1>

          <p className="text-gray-200 text-lg max-w-2xl mx-auto mb-8">
            Report waste problems, track complaints, and help authorities keep your city clean and efficient.
          </p>

       <Link href="/auth/login">
  <Button className="relative overflow-hidden px-10 py-4 text-lg font-semibold rounded-xl 
  bg-gradient-to-r from-sky-500 to-emerald-500 text-white 
  shadow-lg transition-all duration-300 
  hover:scale-110 hover:shadow-2xl">

    {/* ✨ shine effect */}
    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
    opacity-0 hover:opacity-100 transition duration-700 animate-shine"></span>

    {/* 🔥 content */}
    <span className="relative z-10 flex items-center gap-2">
      Get Started 🚀
    </span>

  </Button>
</Link>
        </section>

        {/* FEATURE CARDS */}
        <section className="max-w-6xl mx-auto px-6 pb-32 grid md:grid-cols-2 gap-12">

          {/* REPORT */}
          <UltraCard bg="/report.jpg">

            

            <h2 className="text-2xl font-bold mb-3">
              Report Issue
            </h2>

            <p className="text-gray-200 mb-8">
              Report waste issues with location and images.
            </p>

            <Link href="/auth/login">
              <Button className="w-full bg-sky-600 hover:bg-sky-700 rounded-xl py-5 text-lg">
                Report Now
              </Button>
            </Link>

          </UltraCard>

          {/* TRACK */}
          <UltraCard bg="/track.jpg">

            <h2 className="text-2xl font-bold mb-3">
              Track Complaints
            </h2>

            <p className="text-gray-200 mb-8">
              Monitor complaints in real-time.
            </p>

            <Link href="/auth/login">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl py-5 text-lg">
                View Status
              </Button>
            </Link>

          </UltraCard>

        </section>

        {/* HOW IT WORKS */}
        <section
          className="relative py-24 bg-cover bg-center"
          style={{ backgroundImage: "url('/hit.png')" }}
        >

          <div className="absolute inset-0 bg-black/70" />

          <div className="relative z-10">

            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              How It Works
            </h2>

            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6">

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center text-white hover:scale-105 transition">
                <h3 className="font-bold text-lg mb-2"> Report</h3>
                <p>Citizen reports waste issue</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center text-white hover:scale-105 transition">
                <h3 className="font-bold text-lg mb-2"> Assign</h3>
                <p>Admin assigns worker</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center text-white hover:scale-105 transition">
                <h3 className="font-bold text-lg mb-2"> Resolve</h3>
                <p>Worker resolves issue</p>
              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
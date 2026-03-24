'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';

export default function Home() {

  return (
    <main
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.png')" }}   // ✅ KEEP OLD BG
    >

      {/* 🔥 OVERLAY */}
      <div className="bg-black/60 min-h-screen">

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
            <Button className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-lg px-8 py-4 rounded-xl shadow-lg">
              Get Started 🚀
            </Button>
          </Link>

        </section>

        {/* FEATURE CARDS */}
        <section className="max-w-6xl mx-auto px-6 pb-32 grid md:grid-cols-2 gap-12">

          {/* REPORT */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:scale-105 hover:shadow-2xl transition duration-300 text-white">

            <div className="w-14 h-14 bg-sky-500/20 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📍</span>
            </div>

            <h2 className="text-xl font-bold mb-2">
              Report Issue
            </h2>

            <p className="text-gray-200 mb-6">
              Quickly report waste problems with location, images, and details for faster action.
            </p>

            <Link href="/auth/login">
              <Button className="w-full bg-sky-600 hover:bg-sky-700 rounded-lg">
                Report Now
              </Button>
            </Link>

          </div>

          {/* TRACK */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:scale-105 hover:shadow-2xl transition duration-300 text-white">

            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📊</span>
            </div>

            <h2 className="text-xl font-bold mb-2">
              Track Complaints
            </h2>

            <p className="text-gray-200 mb-6">
              Monitor complaint status in real-time and stay updated on resolution progress.
            </p>

            <Link href="/auth/login">
              <Button variant="outline" className="w-full rounded-lg border-white text-white hover:bg-white hover:text-black">
                View Status
              </Button>
            </Link>

          </div>

        </section>

      </div>

      {/* ✅ HOW IT WORKS (NEW IMAGE hit.png) */}
      <section
        className="relative py-24 bg-cover bg-center"
        style={{ backgroundImage: "url('/hit.png')" }}   // ✅ NEW BG HERE
      >

        {/* overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* content */}
        <div className="relative z-10">

          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How It Works
          </h2>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6">

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center shadow-lg text-white">
              <h3 className="font-bold text-lg mb-2">📍 Report</h3>
              <p className="text-gray-200">Citizen reports waste issue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center shadow-lg text-white">
              <h3 className="font-bold text-lg mb-2">🛠 Assign</h3>
              <p className="text-gray-200">Admin assigns worker</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl text-center shadow-lg text-white">
              <h3 className="font-bold text-lg mb-2">✅ Resolve</h3>
              <p className="text-gray-200">Worker resolves issue</p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
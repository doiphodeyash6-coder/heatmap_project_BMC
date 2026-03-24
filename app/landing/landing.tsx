'use client';

import { Navigation } from '@/components/Navigation';
import Link from 'next/link';
import './landing.css';
export default function LandingPage() {

  const steps = [
    {
      title: "Report Waste",
      desc: "Citizens report waste issues with location and photos.",
    },
    {
      title: "Assign Worker",
      desc: "BMC officers assign complaints to workers.",
    },
    {
      title: "Resolve Issue",
      desc: "Workers clean and resolve the complaint.",
    },
  ];

  const impacts = [
    {
      title: "Clean City",
      value: "100+ Issues",
      desc: "Resolved successfully",
    },
    {
      title: "Fast Response",
      value: "24 Hours",
      desc: "Average resolution time",
    },
    {
      title: "Active Workers",
      value: "50+",
      desc: "Working daily",
    },
  ];

  return (
    <main>

      <Navigation />

      <div className="landing-page">

        {/* HERO */}
        <section className="hero">
          <div className="hero-content">

            <div className="hero-text">
              <h1>
                Turning <span>Waste Complaints</span> into <span>Clean Cities</span>
              </h1>

              <p>
                Report waste issues, track complaints, and help authorities keep your city clean.
              </p>

              <div className="hero-actions">
                <Link href="/complaints/new" className="primary-btn">
                  Report Issue
                </Link>

                <Link href="/complaints" className="secondary-btn">
                  View Complaints
                </Link>
              </div>
            </div>

            <div className="hero-image">
              <img
                src="https://cdn-icons-png.flaticon.com/512/1046/1046857.png"
                className="floating-img"
              />
            </div>

          </div>
        </section>

        {/* PROBLEM */}
        <section className="problem">
          <h2>The Problem</h2>
          <p>
            Waste issues go unnoticed and unreported. Without proper tracking,
            cities struggle to manage garbage efficiently.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-it-works">
          <div className="container">

            <h2>How WasteTrack Works</h2>

            <div className="steps">
              {steps.map((step, i) => (
                <div key={i} className="step-card">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* IMPACT */}
        <section className="impact-section">
          <div className="container">

            <h2>Impact</h2>

            <div className="impact-grid">
              {impacts.map((item, i) => (
                <div key={i} className="impact-card">
                  <div className="overlay">
                    <h3>{item.value}</h3>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container">

            <h2>Start Reporting Today</h2>
            <p>Help make your city cleaner</p>

            <Link href="/complaints/new" className="btn btn-primary btn-large">
              Report Now
            </Link>

          </div>
        </section>

      </div>

    </main>
  );
}
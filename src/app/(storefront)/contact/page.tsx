"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { WhatsAppContactLink } from "@/components/contact/WhatsAppContactLink";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Custom Saree Tailoring & Inquiries",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, website }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "We could not send your inquiry.");
      setSubmitted(true);
    } catch (err) { setError(err instanceof Error ? err.message : "We could not send your inquiry."); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-ivory-100 pb-20 pt-12 sm:pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl sm:mb-14">
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[.24em] text-gold-800 sm:text-xs">
            Contact PREHERITAGE
          </span>
          <h1 className="mb-3 max-w-[13ch] font-serif text-4xl font-normal leading-[1.02] text-charcoal-900 sm:text-5xl lg:text-6xl">
            We&apos;re here to listen.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-charcoal-600 sm:text-base">
            Send a message using the form, or choose one of the contact details below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Details */}
          <div className="space-y-7 lg:col-span-5">
            <div className="space-y-5 text-sm">
              <h2 className="border-b border-ivory-300 pb-3 font-serif text-2xl font-medium text-charcoal-900">Contact details</h2>

              <WhatsAppContactLink
                className="flex min-h-16 items-center gap-4 border-b border-ivory-300 py-4 text-charcoal-800 transition-colors hover:text-gold-800"
                fallbackHref="#contact-form"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-gold-700" />
                <div>
                  <span className="block font-semibold">WhatsApp Concierge</span>
                  <span className="text-xs text-charcoal-500">Message our support team</span>
                </div>
              </WhatsAppContactLink>

              <div className="flex min-h-16 items-center gap-4 border-b border-ivory-300 py-4">
                <Mail className="w-5 h-5 text-gold-600 shrink-0" />
                <div className="min-w-0">
                  <span className="block font-semibold text-charcoal-900">Email</span>
                  <a href="mailto:care@preheritage.com" className="break-all text-charcoal-600 underline decoration-ivory-400 underline-offset-4 hover:text-gold-800">care@preheritage.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0" />
                <div>
                  <span className="mb-1 block font-semibold text-charcoal-900">Atelier</span>
                  <span className="text-sm leading-6 text-charcoal-600">
                    Preheritage Luxury House, Connaught Place, New Delhi 110001, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="border-y border-ivory-300 bg-ivory-50 px-5 py-7 sm:px-8 sm:py-9 lg:col-span-7">
            {submitted ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-gold-600 mx-auto" />
                <h2 className="font-serif text-2xl font-medium text-charcoal-900">
                  Your message has been received.
                </h2>
                <p className="text-xs text-charcoal-100 max-w-sm mx-auto">
                  Thank you for contacting PREHERITAGE.
                </p>
              </div>
            ) : (
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-5 text-sm">
                <h2 className="mb-2 font-serif text-2xl font-medium text-charcoal-900">Send a message</h2>
                <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden"><label>Leave this field blank<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-xs font-semibold text-charcoal-800">Your full name <span aria-hidden="true">*</span></label>
                    <input
                      type="text"
                      id="contact-name"
                      required
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="min-h-12 w-full border border-ivory-400 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-gold-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold text-charcoal-800">Email address <span aria-hidden="true">*</span></label>
                    <input
                      type="email"
                      id="contact-email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="min-h-12 w-full border border-ivory-400 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-gold-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-semibold text-charcoal-800">Mobile / WhatsApp number</label>
                    <input
                      type="tel"
                      id="contact-phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your number"
                      className="min-h-12 w-full border border-ivory-400 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-gold-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold text-charcoal-800">Inquiry topic</label>
                    <select
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="min-h-12 w-full border border-ivory-400 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-gold-700 focus:outline-none"
                    >
                      <option value="Custom Saree Tailoring & Inquiries">Custom Saree & Blouse Tailoring</option>
                      <option value="Bridal Trousseau Curation">Bridal Trousseau Curation</option>
                      <option value="Order Tracking & Logistics">Order Tracking & Logistics</option>
                      <option value="Returns & Exchange">Returns & Exchange</option>
                      <option value="International Wholesale & Press">International Wholesale & Press</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold text-charcoal-800">Message details <span aria-hidden="true">*</span></label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about the occasion, preferred craft region, or delivery questions..."
                    className="w-full border border-ivory-400 bg-white px-3 py-3 text-sm leading-6 text-charcoal-900 focus:border-gold-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-charcoal-900 px-7 py-3.5 text-xs font-semibold uppercase tracking-[.16em] text-ivory-50 transition-colors hover:bg-[#39312A] disabled:cursor-wait disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending…" : "Send Message"}</span>
                </button>
                {error && <p role="alert" className="border-l-2 border-rose-700 py-2 pl-3 text-sm text-rose-800">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

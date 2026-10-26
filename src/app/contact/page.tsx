"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Custom Saree Tailoring & Inquiries",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-gold-600 font-bold block mb-1">
            Private Atelier Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-3">
            Connect With Preheritage
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-100 font-light">
            Our luxury cultural advisors are here to assist with custom weave bridal trousseaus, international sizing, and order dispatches.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm space-y-4 text-xs">
              <h2 className="font-serif text-lg font-bold text-charcoal-900">Direct Contact Channels</h2>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-emerald-950 flex items-center gap-3 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block text-sm">WhatsApp Concierge Desk</span>
                  <span className="text-emerald-800 text-[11px]">+91 98765 43210 (10 AM - 8 PM IST)</span>
                </div>
              </a>

              <div className="p-4 bg-ivory-100 rounded border border-ivory-200 flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-600 shrink-0" />
                <div>
                  <span className="font-semibold block text-charcoal-900">Patron Care Email</span>
                  <span className="text-charcoal-200">care@preheritage.com</span>
                </div>
              </div>

              <div className="p-4 bg-ivory-100 rounded border border-ivory-200 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0" />
                <div>
                  <span className="font-semibold block text-charcoal-900">Official Flagship Atelier</span>
                  <span className="text-charcoal-200">
                    Preheritage Luxury House, Connaught Place, New Delhi 110001, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-gold-600 mx-auto" />
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  Message Received With Honor
                </h3>
                <p className="text-xs text-charcoal-100 max-w-sm mx-auto">
                  A personal Preheritage stylist advisor will contact you within 4-6 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h2 className="font-serif text-lg font-bold text-charcoal-900 mb-2">Send An Atelier Inquiry</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Maharani Gayatri"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
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
                  <label className="block text-charcoal-400 font-semibold mb-1">Message Details *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about the occasion, preferred craft region, or delivery questions..."
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

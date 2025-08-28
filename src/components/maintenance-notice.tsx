"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Construction, Sparkles, Zap, Shield, Database, Brain, Send, CheckCircle } from "lucide-react";

export default function MaintenanceNotice() {
  const [formData, setFormData] = useState({
    twitter: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/maintenance-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        console.error('Failed to submit feedback');
        // You could show an error message here
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You could show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-white text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">Eva's Mirror is Evolving</h1>
          <p className="text-pink-100">Major upgrades in progress</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700">
              We're implementing groundbreaking improvements to enhance your experience with Eva.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Expected completion: Coming Soon
            </p>
          </div>

          {/* Upgrade Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Being Upgraded:</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <UpgradeItem
                icon={<Database className="h-5 w-5" />}
                title="Unified Storage System"
                description="Seamless point tracking across all devices with zero data loss"
              />
              
              <UpgradeItem
                icon={<Sparkles className="h-5 w-5" />}
                title="Enhanced OG Recognition"
                description="Automatic verification and one-time bonus application for original members"
              />
              
              <UpgradeItem
                icon={<Brain className="h-5 w-5" />}
                title="Smarter Eva Interactions"
                description="More personalized conversations with improved memory and context"
              />
              
              <UpgradeItem
                icon={<Zap className="h-5 w-5" />}
                title="Real-time Point Updates"
                description="Instant point calculations and live leaderboard updates"
              />
              
              <UpgradeItem
                icon={<Shield className="h-5 w-5" />}
                title="Session Recovery System"
                description="Never lose progress with automatic session backup and restoration"
              />
              
              <UpgradeItem
                icon={<Construction className="h-5 w-5" />}
                title="Unified Experience"
                description="Mirror and Profile merged into one seamless interface"
              />
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 text-center">
            <p className="text-lg font-medium text-gray-800 mb-2">
              Your points and progress are safe!
            </p>
            <p className="text-sm text-gray-600">
              All user data is preserved and will be automatically migrated when we relaunch.
            </p>
          </div>

          {/* Feedback Form */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Get Notified When We're Back
            </h3>
            
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-800">Thank you!</p>
                <p className="text-sm text-gray-600 mt-1">We'll keep you updated on our progress.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Handle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="@yourusername"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what you're most excited about..."
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Notify Me
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Stay Updated */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Follow <span className="font-semibold text-pink-600">@EvaOnlineXYZ</span> for updates
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UpgradeItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="text-pink-600 mt-1">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

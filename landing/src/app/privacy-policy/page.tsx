"use client";

import { useState, useEffect, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Database,
  Users,
  Eye,
  Clock,
  Mail,
  ArrowUp,
  ChevronRight,
  Search,
  Check,
  Copy,
  Lock,
  FileText,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Info
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Handle scroll detection for back-to-top and active TOC highlighting
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      const sectionIds = [
        "introduction",
        "information",
        "third-party",
        "opt-out",
        "data-retention",
        "children",
        "security",
        "changes",
        "contact",
        "consent",
      ];

      const scrollPosition = window.scrollY + 200;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("boraborhasib@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const sections = useMemo(
    () => [
      { id: "introduction", label: "Introduction", icon: Shield, badge: "Overview" },
      { id: "information", label: "Information Collection", icon: Database, badge: "Data Types" },
      { id: "third-party", label: "Third Party Access", icon: Users, badge: "Integrations" },
      { id: "opt-out", label: "Opt-Out Rights", icon: Eye, badge: "Control" },
      { id: "data-retention", label: "Data Retention", icon: Clock, badge: "Storage" },
      { id: "children", label: "Children's Privacy", icon: Users, badge: "13+ Policy" },
      { id: "security", label: "Security Measures", icon: Lock, badge: "Protection" },
      { id: "changes", label: "Policy Changes", icon: FileText, badge: "Updates" },
      { id: "contact", label: "Contact Us", icon: Mail, badge: "Support" },
      { id: "consent", label: "Your Consent", icon: ShieldCheck, badge: "Agreement" },
    ],
    []
  );

  const filteredSections = sections.filter(
    (sec) =>
      sec.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Header */}
      <header className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-slate-50 to-slate-50/50 dark:from-primary/15 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800/60 pt-12 pb-16 px-6 md:px-12">
        {/* Background glow graphics */}
        <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-[100px] -top-24 -left-24 pointer-events-none" />
        <div className="absolute w-80 h-80 bg-violet-500/10 rounded-full blur-[90px] top-1/2 right-0 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs mb-6 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Legal & Data Transparency</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <span className="text-slate-500 dark:text-zinc-400">Effective June 1, 2025</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
              Privacy Policy for <span className="font-serif italic text-primary">Langoreads</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-8">
              We value your trust. Learn how <strong className="text-slate-900 dark:text-zinc-200">Langoreads App</strong> collects, uses, and safeguards your information with full transparency.
            </p>

            {/* Quick Search & Summary Stats */}
            <div className="w-full max-w-xl relative">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 absolute left-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search topics (e.g., location, email, deletion, 13+)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm text-slate-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Meta Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/80 dark:border-zinc-800/80 max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Application</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Langoreads App</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Provider</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Humayun Rashid</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Service Type</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Commercial (&quot;AS IS&quot;)</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Privacy Contact</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">boraborhasib@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with TOC Sidebar + Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Table of Contents Sticky Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 z-20">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                    Policy Index
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {filteredSections.length} Topics
                </span>
              </div>

              <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
                        isActive
                          ? "bg-primary text-white font-semibold shadow-sm shadow-primary/20"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
                        <span className="truncate">{sec.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? "text-white translate-x-0.5" : "opacity-0 group-hover:opacity-100 text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>

              {/* Need help footer card */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/50 p-3.5 rounded-2xl">
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-2">Have privacy concerns?</p>
                <button
                  onClick={handleCopyEmail}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-2xs"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedEmail ? "Email Copied!" : "Copy Support Email"}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Privacy Policy Content */}
          <div className="flex-1 w-full space-y-10">

            {/* 1. INTRODUCTION */}
            <section
              id="introduction"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Section 01</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Introduction</h2>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  This privacy policy applies to the <strong className="text-primary font-semibold">Langoreads app</strong> (hereby referred to as &quot;Application&quot;) for mobile devices that was created by <strong className="text-slate-900 dark:text-white font-semibold">Humayun Rashid</strong> (hereby referred to as &quot;Service Provider&quot;) as a Commercial service.
                </p>
                <p>
                  Please also review our <a href="#" className="text-primary hover:underline font-medium">&quot;Terms of Service&quot;</a> which govern your use of the LangoRead service and set out the legal terms between you and LangoRead. By installing and using the Langoreads app, you agree to the collection and use of information in accordance with this policy.
                </p>

                <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    If you have any questions or suggestions regarding our Privacy Policy, do not hesitate to contact the Service Provider directly.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. INFORMATION COLLECTION AND USE */}
            <section
              id="information"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Section 02</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Information Collection and Use</h2>
                </div>
              </div>

              <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  The Application collects information when you download and use it. This information is automatically gathered to ensure smooth functionality and optimize system performance:
                </p>

                {/* Collected Specs Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Your device's Internet Protocol address (IP address)",
                    "Pages visited, time & date of visits, and time spent on pages",
                    "Total duration & frequency of time spent on the Application",
                    "Mobile operating system details & device specs",
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Location Data Usage Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-primary/5 to-transparent border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Location Data Usage</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                    The Application may collect location data for the following essential capabilities:
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Geolocation Services", desc: "Provide personalized content and location-relevant audiobook suggestions" },
                      { label: "Analytics & Improvements", desc: "Analyze aggregated user behavior to enhance application performance" },
                      { label: "Third-Party Integration", desc: "Optimize service delivery and secure network requests" },
                    ].map((loc, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/80 dark:bg-zinc-900/80 p-3 rounded-xl border border-slate-200/50 dark:border-zinc-800">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white mr-2">{loc.label}:</span>
                          <span className="text-xs text-slate-600 dark:text-zinc-400">{loc.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Information Note */}
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-primary text-white shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Personal Information Requested</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300">
                      For an enhanced experience, while using our Application, we may require you to provide us with certain personally identifiable information, including but not limited to <strong className="text-slate-900 dark:text-white">gender, email address, first name, and last name</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. THIRD PARTY ACCESS */}
            <section
              id="third-party"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Section 03</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Third Party Access</h2>
                </div>
              </div>

              <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  Only aggregated, anonymized data is periodically transmitted to external services to assist the Service Provider in constantly improving the Application and quality of service.
                </p>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Integrated Third-Party Service Providers:</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                          G
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Google Play Services</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs">
                          E
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Expo Platform</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Legal Disclosure Warning Box */}
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Legal Disclosure Obligations</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                    The Service Provider may disclose User Provided and Automatically Collected Information as required by law (such as to comply with a subpoena or legal process), or when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. OPT-OUT RIGHTS */}
            <section
              id="opt-out"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Section 04</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Opt-Out Rights</h2>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Complete Control & Easy Uninstall</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-xl">
                      You can stop all collection of information by the Application easily by simply <strong className="text-slate-900 dark:text-white">uninstalling it</strong>. You may use the standard uninstall processes available on your mobile device or via the mobile application marketplace.
                    </p>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-md shadow-emerald-600/20 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>No Lock-In</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. DATA RETENTION POLICY */}
            <section
              id="data-retention"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Section 05</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Retention Policy & Deletion</h2>
                </div>
              </div>

              <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter.
                </p>

                {/* Data Deletion Box */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Request Data Deletion</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                      Want your data permanently deleted? Send us an email request and we will process it promptly.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={handleCopyEmail}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-primary hover:text-primary text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      <span>{copiedEmail ? "Copied!" : "Copy Email"}</span>
                    </button>

                    <a
                      href="mailto:boraborhasib@gmail.com"
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Mail</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. CHILDREN'S PRIVACY */}
            <section
              id="children"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Section 06</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Children&apos;s Privacy</h2>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <div className="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500 text-white font-bold text-xs">
                    Age Restriction: 13+
                  </div>
                  <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">
                    The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    If you are a parent or legal guardian and discover that your child under 13 has provided personal data, please contact us immediately at <strong className="text-slate-900 dark:text-white">boraborhasib@gmail.com</strong> so we can take necessary removal actions.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. SECURITY MEASURES */}
            <section
              id="security"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Section 07</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Security Measures</h2>
                </div>
              </div>

              <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  The Service Provider is committed to safeguarding the confidentiality of your information through multi-layered administrative, electronic, and physical safeguards.
                </p>

                {/* 3 Pillars of Security Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl">
                      🏢
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Physical Safeguards</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Secure data center storage with physical access controls.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                      🔒
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Electronic Encryption</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Encrypted transmission protocols for network requests.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
                      👥
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Procedural Control</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Restricted personnel access on a strict need-to-know basis.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. POLICY CHANGES */}
            <section
              id="changes"
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Section 08</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Policy Changes</h2>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 dark:text-zinc-300 leading-relaxed text-base">
                <p>
                  This Privacy Policy may be updated from time to time for any reason. We will notify you of any changes by updating this page with the new Privacy Policy.
                </p>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
                </p>
              </div>
            </section>

            {/* 9. CONTACT US */}
            <section
              id="contact"
              className="bg-gradient-to-br from-primary/10 via-slate-900 to-zinc-900 text-white p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden"
            >
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary-light uppercase tracking-wider">Section 09</span>
                    <h2 className="text-2xl font-bold text-white">Contact Us</h2>
                  </div>
                </div>

                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  If you have any questions regarding privacy while using the Application, or have questions about our data practices, please reach out to us:
                </p>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Official Contact Email</p>
                      <a
                        href="mailto:boraborhasib@gmail.com"
                        className="text-lg font-bold text-white hover:text-primary-light transition-colors"
                      >
                        boraborhasib@gmail.com
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyEmail}
                    className="px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    <span>{copiedEmail ? "Copied to Clipboard!" : "Copy Email"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 10. YOUR CONSENT */}
            <section
              id="consent"
              className="bg-emerald-500/5 dark:bg-emerald-500/10 p-8 sm:p-10 rounded-3xl border border-emerald-500/20 text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Consent</h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper icon component
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Compass,
  BookmarkPlus,
  Map,
  Users,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Globe,
  Heart,
  Layers,
  Eye,
} from "lucide-react";
import ConsentGate from "@/components/ConsentGate";

/* ---------- Scroll reveal hook ---------- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------- Floating decorative icon ---------- */
function FloatingIcon({
  src,
  alt,
  size = 64,
  floatClass = "animate-float",
  style,
}: {
  src: string;
  alt: string;
  size?: number;
  floatClass?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="pointer-events-none absolute hidden md:block select-none"
      style={style}
    >
      <div className={floatClass}>
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="drop-shadow-xl opacity-80 dark:opacity-60"
          draggable={false}
        />
      </div>
    </div>
  );
}

/* ---------- Animated counter ---------- */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- FAQ Accordion Item ---------- */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200/60 dark:border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-medium text-base pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {a}
        </p>
      </motion.div>
    </div>
  );
}

/* ---------- Feature showcase card ---------- */
function FeatureShowcase({
  icon: Icon,
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  badge?: string;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal-on-scroll">
      <div
        className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-8 lg:gap-16`}
      >
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500/10 to-yellow-500/10 dark:from-pink-500/20 dark:to-yellow-500/20 border border-pink-200/40 dark:border-pink-500/20 px-4 py-1.5 mb-4">
            <Icon className="h-4 w-4 text-pink-500" />
            {badge && <span className="text-xs font-medium text-pink-600 dark:text-pink-400">{badge}</span>}
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">{title}</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            {description}
          </p>
        </div>
        {/* Image */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/50 border border-zinc-200/50 dark:border-white/10">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={600}
              height={600}
              className="w-full h-auto"
            />
            {/* Gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== Main Landing Page ========== */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden">
      {/* ---- Background glows ---- */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-32 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 dark:opacity-30"
          style={{ background: "radial-gradient(closest-side, #8e79ff, transparent)" }}
        />
        <div
          className="absolute top-[20vh] right-[-8rem] h-[600px] w-[600px] rounded-full blur-[120px] opacity-15 dark:opacity-25"
          style={{ background: "radial-gradient(closest-side, #f17ea7, transparent)" }}
        />
        <div
          className="absolute top-[60vh] left-[-10rem] h-[400px] w-[400px] rounded-full blur-[100px] opacity-10 dark:opacity-20"
          style={{ background: "radial-gradient(closest-side, #fcd77f, transparent)" }}
        />
        <div
          className="absolute bottom-[-8rem] right-1/4 h-[500px] w-[500px] rounded-full blur-[120px] opacity-10 dark:opacity-20"
          style={{ background: "radial-gradient(closest-side, #79c0ff, transparent)" }}
        />
      </div>

      <main className="relative z-10">
        {/* ===== Floating Glass Navbar ===== */}
        <header className="sticky top-0 z-50 px-4 pt-3">
          <nav className="mx-auto max-w-5xl rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-lg shadow-black/5 dark:shadow-black/30">
            <div className="flex items-center justify-between px-5 py-2.5">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/logos/exploree.png"
                  alt="Exploree"
                  width={32}
                  height={32}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
                <span className="text-base font-bold tracking-tight">Exploree</span>
              </Link>

              {/* Nav links — desktop */}
              <div className="hidden sm:flex items-center gap-1">
                {[
                  { label: "Privacy", href: "/privacy" },
                  { label: "Cookies", href: "/cookies" },
                  { label: "Contact", href: "mailto:dejny@dejny.eu", external: true },
                ].map((item) => {
                  const El = item.external ? "a" : Link;
                  return (
                    <El
                      key={item.label}
                      href={item.href}
                      className="px-3.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200"
                    >
                      {item.label}
                    </El>
                  );
                })}
              </div>

              {/* Sign-in pill */}
              <div className="rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 p-[1.5px]">
                <button
                  onClick={() => {
                    const el = document.querySelector('[data-consent-gate]') as HTMLElement;
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold
                             bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
                             hover:bg-gradient-to-r hover:from-pink-400 hover:to-yellow-300 hover:text-black
                             transition-all duration-200"
                >
                  Sign in
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* ===== Hero ===== */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 sm:pt-24 pb-20">
          {/* Floating icons around hero */}
          <FloatingIcon
            src="/landing/icon-waypoint.png"
            alt="Map pin"
            size={72}
            floatClass="animate-float"
            style={{ top: "10%", left: "4%", transform: "rotate(-12deg)" }}
          />
          <FloatingIcon
            src="/landing/icon-compass.png"
            alt="Compass"
            size={60}
            floatClass="animate-float-slow-delayed"
            style={{ top: "15%", right: "5%", transform: "rotate(8deg)" }}
          />
          <FloatingIcon
            src="/landing/icon-star.png"
            alt="Star"
            size={44}
            floatClass="animate-float-slow"
            style={{ bottom: "20%", left: "8%", transform: "rotate(15deg)" }}
          />
          <FloatingIcon
            src="/landing/icon-heart.png"
            alt="Heart"
            size={48}
            floatClass="animate-float-delayed"
            style={{ bottom: "12%", right: "7%", transform: "rotate(-6deg)" }}
          />

          <div className="flex flex-col items-center text-center gap-6 animate-fade-in-up">
            {/* Logo */}
            <div className="animate-float">
              <Image
                src="/logos/exploree.png"
                alt="Exploree logo"
                width={120}
                height={120}
                priority
                className="drop-shadow-lg"
              />
            </div>

            {/* Gradient headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Discover places{" "}
              <span
                className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent animate-gradient-x"
                style={{ backgroundSize: "200% 200%" }}
              >
                worth the trip
              </span>
            </h1>

            {/* Sub */}
            <p className="max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Swipe through real spots shared by real people. Save your favourites
              into collections, explore them on a map, and follow travellers with
              incredible taste.
            </p>

            {/* CTA */}
            <div className="mt-4">
              <ConsentGate />
            </div>

            {/* Tiny social proof line */}
            <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Join hundreds of explorers already discovering the world
            </p>
          </div>
        </section>

        {/* ===== App Preview - Hero image ===== */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="relative">
            {/* Glow behind the image */}
            <div
              className="absolute inset-0 -m-8 rounded-3xl blur-3xl opacity-30 dark:opacity-50"
              style={{ background: "linear-gradient(135deg, #f17ea7 0%, #8e79ff 50%, #fcd77f 100%)" }}
            />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 dark:shadow-black/60 border border-zinc-200/50 dark:border-white/10">
              <Image
                src="/landing/swipe-preview.png"
                alt="Exploree swipe deck in action"
                width={1024}
                height={1024}
                className="w-full h-auto"
                priority
              />
              {/* Glass overlay strip */}
              <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-zinc-950/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <FloatingIcon
            src="/landing/icon-camera.png"
            alt="Camera"
            size={56}
            floatClass="animate-float-slow"
            style={{ top: "-10px", right: "3%", transform: "rotate(10deg)" }}
          />
          <HowItWorks />
        </section>

        {/* ===== Feature showcases ===== */}
        <section className="mx-auto max-w-6xl px-6 py-12 space-y-32">
          <FeatureShowcase
            icon={Compass}
            badge="Core Experience"
            title="A swipe deck that never runs dry"
            description="An endless stream of beautiful places, curated by real travellers. Swipe right to save, left to skip — the algorithm learns your taste and serves you fresh discoveries every time."
            imageSrc="/landing/swipe-preview.png"
            imageAlt="Swipe deck feature"
          />
          <FeatureShowcase
            icon={BookmarkPlus}
            badge="Organization"
            title="Collections that tell a story"
            description="Group your saved spots into themed collections — weekend getaways, dream trips, food spots. Keep them private or share them with friends. Your personal travel journal, always ready."
            imageSrc="/landing/collections-preview.png"
            imageAlt="Collections feature"
            reverse
          />
          <FeatureShowcase
            icon={Map}
            badge="Visualization"
            title="See it all on the map"
            description="Every saved spot and discovery pinned on a beautiful interactive map. Plan your next adventure by seeing what's nearby, or zoom out to dream about your next continent."
            imageSrc="/landing/map-preview.png"
            imageAlt="Map view feature"
          />
        </section>

        {/* ===== Stats ===== */}
        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <FloatingIcon
            src="/landing/icon-globe.png"
            alt="Globe"
            size={80}
            floatClass="animate-float-slow-delayed"
            style={{ top: "10%", left: "2%", transform: "rotate(-5deg)" }}
          />
          <FloatingIcon
            src="/landing/icon-star.png"
            alt="Star"
            size={40}
            floatClass="animate-float"
            style={{ bottom: "15%", right: "4%", transform: "rotate(20deg)" }}
          />
          <StatsSection />
        </section>

        {/* ===== More features grid ===== */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <MoreFeatures />
        </section>

        {/* ===== FAQ ===== */}
        <section className="relative mx-auto max-w-3xl px-6 py-20">
          <FloatingIcon
            src="/landing/icon-waypoint.png"
            alt="Map pin"
            size={50}
            floatClass="animate-float-slow"
            style={{ top: "5%", right: "-8%", transform: "rotate(12deg)" }}
          />
          <FaqSection />
        </section>

        {/* ===== Bottom CTA ===== */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <BottomCTA />
        </section>

        {/* ===== Footer ===== */}
        <footer className="border-t border-zinc-200/60 dark:border-white/10 py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Image src="/logos/exploree.png" alt="Exploree" width={28} height={28} />
                <span className="font-semibold">Exploree</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/cookies" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Cookies
                </Link>
                <a
                  href="mailto:dejny@dejny.eu"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              © {new Date().getFullYear()} Exploree. Built by <Link href="https://dejny.eu" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Dejny</Link>.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-sections as smaller components for readability
   ============================================================ */

function HowItWorks() {
  const ref = useReveal();
  const steps = [
    {
      icon: Eye,
      n: "1",
      title: "Swipe to explore",
      desc: "Browse a never-ending deck of places. Skip what's not for you, keep what is. The deck learns your taste.",
    },
    {
      icon: BookmarkPlus,
      n: "2",
      title: "Save to collections",
      desc: "Organize your favourite spots into collections you can revisit, share, and take on your next trip.",
    },
    {
      icon: Users,
      n: "3",
      title: "Follow explorers",
      desc: "Follow people whose taste you trust. See their newest finds first and get inspired.",
    },
  ];

  return (
    <div ref={ref} className="reveal-on-scroll">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-pink-500 mb-2">
          Simple & intuitive
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-3 stagger-children">
        {steps.map((s) => (
          <div
            key={s.n}
            className="group relative rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-8 backdrop-blur hover:border-pink-300/50 dark:hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/5"
          >
            {/* Step number badge */}
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-amber-300 text-sm font-bold text-black shadow-md">
              {s.n}
            </div>
            <h3 className="font-bold text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {s.desc}
            </p>
            {/* Hover shimmer */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection() {
  const ref = useReveal();
  const stats = [
    { value: 1200, suffix: "+", label: "Places shared" },
    { value: 350, suffix: "+", label: "Active explorers" },
    { value: 45, suffix: "", label: "Countries covered" },
    { value: 8500, suffix: "+", label: "Spots saved" },
  ];

  return (
    <div ref={ref} className="reveal-on-scroll">
      <div className="rounded-3xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-10 sm:p-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-amber-400 bg-clip-text text-transparent">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoreFeatures() {
  const ref = useReveal();
  const features = [
    {
      icon: Heart,
      title: "Smart recommendations",
      desc: "The more you swipe, the better Exploree understands what you love. Fresh picks, every session.",
    },
    {
      icon: MessageCircle,
      title: "Comments & reactions",
      desc: "Share your thoughts on spots. Ask questions, leave tips, and connect with fellow travellers.",
    },
    {
      icon: Globe,
      title: "Public profiles",
      desc: "A beautiful page for everything you've shared. Showcase your travel taste to the world.",
    },
    {
      icon: Layers,
      title: "Tags & filtering",
      desc: "Search by vibe — beach, nature, city, cave, fun. Find exactly the kind of place you're craving.",
    },
    {
      icon: Sparkles,
      title: "Fresh content daily",
      desc: "New spots are added by the community every day. There's always something new to discover.",
    },
    {
      icon: ArrowRight,
      title: "Share anywhere",
      desc: "Share your collections or favourite spots with a single link. Works beautifully on any device.",
    },
  ];

  return (
    <div ref={ref} className="reveal-on-scroll">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-pink-500 mb-2">
          Everything you need
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold">Packed with features</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 backdrop-blur hover:border-pink-300/40 dark:hover:border-pink-500/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 group-hover:bg-gradient-to-br group-hover:from-pink-400/20 group-hover:to-amber-300/20 transition-colors">
              <f.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-300 group-hover:text-pink-500 transition-colors" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqSection() {
  const ref = useReveal();
  const faqs = [
    {
      q: "Is Exploree free to use?",
      a: "Yes! Exploree is completely free. Just sign in with your Google account and start discovering places right away.",
    },
    {
      q: "How are spots added to the platform?",
      a: "Every spot on Exploree is shared by real users — people who've actually been there. You can add your own favourite places too once you sign up.",
    },
    {
      q: "Can I make my collections private?",
      a: "Absolutely. When you create a collection, you can choose whether it's public (visible to everyone) or private (just for you).",
    },
    {
      q: "What data do you collect?",
      a: "Only what's necessary to make the app work — your Google profile info (name, email, avatar) and your in-app activity like saves and swipes. We never share or sell your data. Check our Privacy Policy for full details.",
    },
    {
      q: "Can I use Exploree on mobile?",
      a: "Yes! Exploree is a responsive web app that works beautifully on any device — phone, tablet, or desktop. No app download needed.",
    },
  ];

  return (
    <div ref={ref} className="reveal-on-scroll">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-pink-500 mb-2">
          Got questions?
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions</h2>
      </div>
      <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
        {faqs.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
    </div>
  );
}

function BottomCTA() {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal-on-scroll">
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200/70 dark:border-white/10">
        {/* Gradient bg */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)",
          }}
        />
        {/* Floating glow blobs */}
        <div className="absolute top-[-4rem] left-[-4rem] h-56 w-56 rounded-full blur-3xl opacity-40 bg-pink-500" />
        <div className="absolute bottom-[-4rem] right-[-4rem] h-56 w-56 rounded-full blur-3xl opacity-30 bg-amber-400" />

        <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 sm:py-20">
          <Image
            src="/logos/exploree.png"
            alt="Exploree"
            width={64}
            height={64}
            className="mb-6 drop-shadow-lg animate-float"
          />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to explore?
          </h2>
          <p className="text-white/70 max-w-md mb-8 leading-relaxed">
            Join the community of curious travellers discovering incredible
            places every day. It only takes a few seconds.
          </p>
          <ConsentGate />
        </div>
      </div>
    </div>
  );
}

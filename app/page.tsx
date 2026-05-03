// app/page.tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // If already logged in, skip the landing page entirely
  const session = await auth();
  // if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-white font-bold text-xl">💰 ExpenseAI</span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm 
                       px-4 py-2 rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-center">
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Track expenses.{" "}
          <span className="text-blue-400">Get AI-powered insights.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          Set budgets, track spending, and let AI suggest how much you should
          allocate based on your history.
        </p>
        <Link
          href="/register"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white 
                     font-semibold px-8 py-4 rounded-xl transition text-lg"
        >
          Start for free →
        </Link>
      </section>

      {/* Feature cards */}
      <section
        className="max-w-6xl mx-auto px-8 pb-24 grid grid-cols-1 
                          md:grid-cols-3 gap-6"
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-slate-800/60 border border-slate-700 rounded-xl p-6"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

// Kept outside component — it's static data, no reason to define inside render
const features = [
  {
    icon: "📊",
    title: "Smart Dashboard",
    description:
      "Visualize spending trends across categories with real-time charts.",
  },
  {
    icon: "🤖",
    title: "AI Budget Suggestions",
    description:
      "Gemini AI analyzes your history and recommends budget amounts.",
  },
  {
    icon: "🔄",
    title: "Recurring Expenses",
    description: "Set it once. The system auto-generates entries on schedule.",
  },
];

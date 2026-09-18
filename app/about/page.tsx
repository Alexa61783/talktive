import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Talktive — AI Companion",
  description:
    "Learn about Talktive, an AI companion created by Sataish Jamshaid, officially known as Miss Worship, under LEXVAIN.",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Talktive",
  description:
    "Talktive is an AI companion designed for natural conversations, learning, creativity, writing, coding, and everyday questions.",
  applicationCategory: "AIApplication",
  operatingSystem: "Web",
  creator: {
    "@type": "Person",
    name: "Sataish Jamshaid",
    alternateName: "Miss Worship",
    jobTitle: "CEO, Founder & Visionary",
    worksFor: {
      "@type": "Organization",
      name: "LEXVAIN",
    },
  },
  brand: {
    "@type": "Brand",
    name: "Talktive",
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12 sm:px-10">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <img
                src="/talktive-icon.png"
                alt="Talktive"
                className="h-12 w-12 object-contain"
              />

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Talktive
                </h1>

                <p className="text-sm text-blue-400">
                  Your friendly AI companion
                </p>
              </div>
            </div>

            <a
              href="/"
              className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10"
            >
              Open Talktive
            </a>
          </header>

          {/* Main */}
          <section className="flex-1 py-16">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              About Talktive
            </p>

            <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
              Meet Talktive —
              <span className="text-blue-400">
                {" "}
                your AI companion.
              </span>
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
              Talktive is an AI companion designed to make conversations,
              learning, creativity, writing, coding, and everyday questions
              feel more natural, personal, and human.
            </p>

            {/* What is Talktive */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <h3 className="text-xl font-bold text-white">
                  🤖 What is Talktive?
                </h3>

                <p className="mt-4 leading-7 text-white/65">
                  Talktive is an AI software product built to be a friendly,
                  conversational companion. It can help users learn,
                  brainstorm ideas, write, code, ask questions, and have
                  everyday conversations.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <h3 className="text-xl font-bold text-white">
                  💙 The vision
                </h3>

                <p className="mt-4 leading-7 text-white/65">
                  Talktive is built around the idea that AI should feel
                  approachable, supportive, useful, and natural — not simply
                  like a machine that gives answers.
                </p>
              </div>
            </div>

            {/* Creator */}
            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/[0.05] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Creator
              </p>

              <h3 className="mt-3 text-3xl font-black">
                Sataish Jamshaid
              </h3>

              <p className="mt-2 text-lg font-semibold text-blue-400">
                Officially known as Miss Worship
              </p>

              <p className="mt-5 max-w-2xl leading-7 text-white/70">
                Sataish Jamshaid, officially known as Miss Worship, is the
                CEO, Founder &amp; Visionary behind LEXVAIN, an AI software
                products company. Talktive was created under her vision to
                build a more natural and personal AI companion.
              </p>
            </div>

            {/* Company */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Company
              </p>

              <h3 className="mt-3 text-3xl font-black">
                LEXVAIN
              </h3>

              <p className="mt-4 max-w-2xl leading-7 text-white/70">
                LEXVAIN is an AI software products company focused on
                building modern AI experiences and software products.
              </p>

              <p className="mt-5 font-semibold text-white">
                Sataish Jamshaid — CEO · Founder &amp; Visionary
              </p>

              <p className="mt-1 text-sm text-white/50">
                Officially known as Miss Worship
              </p>
            </div>

            {/* Talktive Identity */}
            <div className="mt-8 rounded-3xl border border-white/10 p-8">
              <h3 className="text-2xl font-black">
                Talktive identity
              </h3>

              <div className="mt-6 space-y-3 text-white/70">
                <p>
                  <span className="font-semibold text-white">
                    Product:
                  </span>{" "}
                  Talktive
                </p>

                <p>
                  <span className="font-semibold text-white">
                    Creator:
                  </span>{" "}
                  Sataish Jamshaid
                </p>

                <p>
                  <span className="font-semibold text-white">
                    Officially known as:
                  </span>{" "}
                  Miss Worship
                </p>

                <p>
                  <span className="font-semibold text-white">
                    Company:
                  </span>{" "}
                  LEXVAIN
                </p>

                <p>
                  <span className="font-semibold text-white">
                    Role:
                  </span>{" "}
                  CEO · Founder &amp; Visionary
                </p>
              </div>
            </div>

            {/* Public identity */}
            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/[0.04] p-8">
              <h3 className="text-2xl font-black">
                About the creator
              </h3>

              <p className="mt-4 max-w-2xl leading-7 text-white/70">
                Sataish Jamshaid is the creator behind Talktive and the
                founder and visionary behind LEXVAIN. She is officially
                known as Miss Worship.
              </p>

              <p className="mt-4 max-w-2xl leading-7 text-white/70">
                Talktive is one of the AI software products created under
                the vision of Sataish Jamshaid.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <a
                href="/"
                className="inline-flex rounded-2xl bg-blue-500 px-7 py-4 font-bold text-black transition hover:bg-blue-400"
              >
                Start talking with Talktive 🤖
              </a>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 pt-6 text-center text-sm text-white/40">
            <p>Talktive by LEXVAIN</p>

            <p className="mt-1">
              Sataish Jamshaid — CEO · Founder &amp; Visionary
            </p>

            <p className="mt-1">
              Officially known as Miss Worship
            </p>

            <p className="mt-2">
              © 2026 LEXVAIN
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
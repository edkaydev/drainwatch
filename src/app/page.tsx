import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  LineChart,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: MapPin,
    title: "Report Incidents",
    description: "Quickly report drainage issues with location.",
  },
  {
    icon: LineChart,
    title: "Get Insights",
    description: "Discover hotspots and trends with AI.",
  },
  {
    icon: ShieldCheck,
    title: "Prioritize Action",
    description: "Focus resources where they're needed most.",
  },
  {
    icon: Building2,
    title: "Build Resilience",
    description: "A safer, cleaner, more resilient Kampala.",
  },
];

const SCORE_FACTORS = [
  "Recurrence — how often a location reappears in reports",
  "Severity — the highest severity reported at that location",
  "Recency — newer reports weigh more than old ones",
  "Concentration — how tightly reports cluster geographically",
];

const LEGEND = [
  { label: "Critical", dot: "bg-critical-500" },
  { label: "High", dot: "bg-warning-500" },
  { label: "Medium", dot: "bg-warning-300" },
  { label: "Low", dot: "bg-success-500" },
];

export default function Home() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-teal-900 sm:text-5xl">
              Smarter Drainage.
              <br />
              <span className="text-brand-600">Safer Kampala.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-ink-600">
              AI-powered insights to detect drainage hazards, prioritize
              interventions, and build a flood-resilient city for a
              sustainable Uganda.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/report" size="lg">
                Report an Incident
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/map" variant="outline" size="lg">
                Explore Map
              </LinkButton>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                SDG 11 · Sustainable Cities
              </span>
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                SDG 13 · Climate Action
              </span>
            </div>
          </div>

          <HeroGraphic />
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-teal-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-500">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Data-driven / impact */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Our approach
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-teal-900">
              Data-driven solutions for a resilient city
            </h2>
            <p className="mt-4 text-ink-600">
              DrainWatch AI turns scattered incident reports into an
              explainable hotspot score based on recurrence, severity,
              recency, and geographic concentration — helping authorities
              focus limited resources where they matter most.
            </p>
            <ul className="mt-8 space-y-3">
              {SCORE_FACTORS.map((factor) => (
                <li key={factor} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <SkylineGraphic />
        </div>
      </section>

      {/* Hotspot map teaser */}
      <section id="insights" className="bg-teal-950">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
              Real-time intelligence
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Explore drainage hotspots in Kampala
            </h2>
            <p className="mt-4 max-w-md text-teal-200">
              View incident data, discover recurring hazards, and track
              response progress across the city.
            </p>
            <LinkButton href="/map" variant="primary" className="mt-8">
              Open Map
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <HotspotGraphic />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-teal-900">
              Want to pilot DrainWatch AI in your district?
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Reach out and we&apos;ll walk you through the reporting flow and
              the dashboard.
            </p>
          </div>
          <LinkButton href="mailto:peace@sustainableaccessfoundation.org" variant="dark">
            Get in touch
          </LinkButton>
        </Card>
      </section>
    </SiteShell>
  );
}

function HeroGraphic() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl shadow-teal-950/20">
        <Image
          src="/drainwatch-hero-kampala.jpg"
          alt="A community member and a field inspector examining a blocked drainage channel in Kampala"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/40 via-transparent to-transparent" />
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-teal-950/70 px-3 py-1.5 text-teal-100 backdrop-blur">
          <MapPin className="h-4 w-4 text-brand-300" />
          <span className="text-xs font-medium">Kampala Central, Uganda</span>
        </div>
      </div>

      <Card className="absolute -bottom-6 left-6 right-6 flex items-center gap-3 p-4 sm:left-10 sm:right-auto sm:w-72">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-500">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-900">Hotspot Detected</p>
          <p className="truncate text-xs text-ink-500">Kampala Central</p>
        </div>
        <span className="ml-auto rounded-full bg-critical-50 px-2.5 py-1 text-xs font-medium text-critical-600">
          High Risk
        </span>
      </Card>
    </div>
  );
}

function SkylineGraphic() {
  return (
    <Card className="relative aspect-[4/3] overflow-hidden">
      <Image
        src="/drainwatch-community-reporting.jpg"
        alt="A resident crouching at a storm drain, photographing the hazard on her phone to submit a report"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal-950/80 to-transparent px-5 pb-4 pt-10 text-xs text-teal-100">
        Every report starts with someone on the ground — photo, location, and
        a few details.
      </p>
    </Card>
  );
}

function HotspotGraphic() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10 lg:aspect-auto lg:h-80">
      <Image
        src="/drainwatch-hotspot-intelligence.jpg"
        alt="An operations analyst reviewing a city-wide hotspot map and incident trends on a wall display"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-950/10 to-transparent" />
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-xl bg-teal-950/80 px-3 py-2 backdrop-blur">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs text-teal-200">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowRight, BarChart3, Check, Layers3, Menu, Satellite, ShieldCheck, X } from 'lucide-react';
import { AuthScreen } from '../types';
import logoFull from '../assets/logo-full.png';
import heroImage from '../assets/home-coastal-facility.jpg';

interface HomeProps {
  isAuthenticated: boolean;
  onNavigate: (screen: AuthScreen) => void;
}

const navigation = [
  { id: 'platform', label: 'The platform' },
  { id: 'data', label: 'Our data' },
  { id: 'partners', label: 'Managed by' },
];
const capabilities = [
  { icon: Satellite, title: 'See emissions in context.', description: 'Explore satellite observations alongside facilities and oil blocks on one map.', background: 'bg-[#f0f0f0]' },
  { icon: BarChart3, title: 'Understand what’s changing.', description: 'Compare sources, locations and time periods to investigate methane trends.', background: 'bg-[#f5f5f5]' },
  { icon: Layers3, title: 'Take the next step.', description: 'Set alerts, bring in field measurements and export evidence for your team.', background: 'bg-primary/5' },
];
const managers = [
  { image: '/branding/nuprc-logo.png', name: 'NUPRC', fullName: 'Nigerian Upstream Petroleum Regulatory Commission' },
  { image: '/branding/nmdpra-logo.png', name: 'NMDPRA', fullName: 'Nigerian Midstream and Downstream Petroleum Regulatory Authority' },
];

const Home: React.FC<HomeProps> = ({ isAuthenticated, onNavigate }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const openPlatform = () => onNavigate(isAuthenticated ? AuthScreen.DASHBOARD : AuthScreen.LOGIN);
  const actionLabel = isAuthenticated ? 'Open platform' : 'Sign in to NOGIET';

  return (
    <main className="nogiet-public-theme h-screen min-h-0 overflow-x-hidden overflow-y-auto bg-[#fafafa] text-[#171717]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-white focus:p-4">Skip to content</a>
      <header className="relative z-20 mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex h-24 items-center justify-between gap-6 border-b border-[#171717]/10">
          <a href="#main-content" aria-label="NOGIET home"><img src={logoFull} alt="NOGIET" className="h-8 w-auto sm:h-9" /></a>
          <nav aria-label="Primary navigation" className="hidden items-center gap-9 md:flex">
            {navigation.map(({ id, label }) => <a key={id} href={`#${id}`} className="text-sm text-neutral-600 hover:text-primary-dark">{label}</a>)}
          </nav>
          <button type="button" onClick={openPlatform} className="nogiet-button nogiet-button-primary hidden md:flex">{isAuthenticated ? 'Open platform' : 'Sign in'}<ArrowRight size={16} aria-hidden="true" /></button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="home-mobile-nav" className="rounded-full border border-neutral-200 p-3 md:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {menuOpen && (
          <nav id="home-mobile-nav" aria-label="Mobile navigation" onKeyDown={(event) => { if (event.key === 'Escape') setMenuOpen(false); }} className="absolute inset-x-6 top-24 rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg md:hidden">
            {navigation.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm hover:bg-neutral-50">{label}</a>)}
            <button type="button" onClick={openPlatform} className="nogiet-button nogiet-button-primary inline-flex mt-3 w-full">{actionLabel}</button>
          </nav>
        )}
      </header>

      <section id="main-content" className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 pb-16 pt-12 sm:px-10 md:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark">A clearer view. A cleaner future.</p>
          <h1 className="mt-6 max-w-2xl text-[clamp(2.75rem,5.2vw,4.6rem)] font-semibold leading-[1.07] tracking-[-0.055em]">One view of methane.<br /><span className="text-[#737373]">One path to action.</span></h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-neutral-600">The Nigerian Oil and Gas Industry Emission Tracker</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">Bring satellite observations and field data together. Understand emissions across Nigeria’s oil and gas sector, and make your next step an informed one.</p>
          <button type="button" onClick={openPlatform} className="nogiet-button nogiet-button-primary mt-8 inline-flex">{actionLabel}<ArrowRight size={18} aria-hidden="true" /></button>
          <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck size={15} aria-hidden="true" />For authorized regulators, operators and partners</p>
        </div>
        <figure className="relative isolate h-[420px] overflow-hidden rounded-[2rem] bg-[#eeeeee] shadow-[0_20px_60px_rgba(0,0,0,0.10)] sm:h-[540px] lg:h-[660px]">
          <div className="absolute inset-0 bg-[#171717]">
            <img src={heroImage} alt="Illustration of a coastal oil and gas facility among mangrove waterways" className="h-full w-full object-cover object-center" />
          </div>
          <figcaption className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:inset-x-6 sm:bottom-6 sm:p-6">
            <div className="flex items-center gap-3"><span className="rounded-full bg-primary/10 p-2.5 text-primary-dark"><Satellite size={21} aria-hidden="true" /></span><div><p className="text-sm font-semibold">Nigeria’s emissions, in focus.</p><p className="mt-1 text-xs leading-5 text-neutral-500">Satellite observations and field data, connected.</p></div></div>
          </figcaption>
        </figure>
      </section>

      <section id="partners" aria-labelledby="managers-title" className="border-y border-[#171717]/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-16">
          <h2 id="managers-title" className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Managed by</h2>
          <div className="grid flex-1 gap-8 sm:grid-cols-2">
            {managers.map(({ image, name, fullName }) => <div key={name} className="flex items-center gap-4"><img src={image} alt={`${name} logo`} className="h-14 w-14 shrink-0 object-contain" /><div><h3 className="text-base font-semibold">{name}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">{fullName}</p></div></div>)}
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark">Meet your shared workspace</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Less scattered data.<br />More understanding.</h2><p className="mt-5 text-sm leading-7 text-neutral-500">The tools to explore, compare and act on emissions data, together in one place.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description, background }) => <article key={title} className={`rounded-3xl p-7 sm:p-8 ${background}`}><span className="inline-flex rounded-2xl bg-white/80 p-3.5 text-primary-dark"><Icon size={25} strokeWidth={1.5} aria-hidden="true" /></span><h3 className="mt-10 max-w-[230px] text-2xl font-semibold leading-tight tracking-[-0.03em]">{title}</h3><p className="mt-4 text-sm leading-7 text-neutral-600">{description}</p></article>)}
        </div>
      </section>

      <section id="data" className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-24 lg:pb-24">
        <div className="rounded-3xl bg-[#f2f2f2] p-7 sm:p-10"><p className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Sources in one place</p><div className="grid gap-3 sm:grid-cols-2">{['Carbon Mapper', 'IMEO', 'TROPOMI', 'NASA EMIT'].map((source) => <div key={source} className="flex items-center gap-3 rounded-xl bg-white px-4 py-5 text-sm font-semibold"><Satellite size={18} strokeWidth={1.5} className="text-primary-dark" aria-hidden="true" />{source}</div>)}</div><div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-5 text-sm text-neutral-600"><Layers3 size={18} aria-hidden="true" />Plus your team’s field measurements</div></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark">Different sources. Shared perspective.</p><h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Better context for<br />better decisions.</h2><p className="mt-5 max-w-md text-sm leading-7 text-neutral-500">Connect observations from multiple satellite providers with local evidence. Keep the source in view as you explore what the data is telling you.</p><ul className="mt-6 space-y-3">{['Compare observations across providers', 'Explore facilities and geographic boundaries', 'Export findings for reporting and follow-up'].map((item) => <li key={item} className="flex items-start gap-3 text-sm text-neutral-600"><Check size={17} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />{item}</li>)}</ul></div>
      </section>

      <section className="mx-6 rounded-[2rem] border border-primary/10 bg-primary/5 px-6 py-14 text-center sm:mx-10 sm:py-16">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your next insight starts here.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600">Sign in to explore Nigeria’s emissions data and continue your team’s work.</p><button type="button" onClick={openPlatform} className="nogiet-button nogiet-button-primary mt-7 inline-flex">{actionLabel}<ArrowRight size={18} aria-hidden="true" /></button>
      </section>
      <footer className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:px-10"><div className="flex flex-col justify-between gap-7 border-b border-neutral-200 pb-8 sm:flex-row"><div><img src={logoFull} alt="NOGIET" className="h-8 w-auto" /><p className="mt-4 max-w-xs text-xs leading-6 text-neutral-500">The Nigerian Oil and Gas Industry Emission Tracker</p></div><p className="max-w-sm text-xs leading-6 text-neutral-500 sm:text-right">Sponsored by the Stakeholder Democracy Network (SDN) with support from the Global Methane Hub.</p></div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500"><p>© {new Date().getFullYear()} NOGIET. All rights reserved.</p><a href="#main-content" className="hover:text-primary-dark">Back to top ↑</a></div></footer>
    </main>
  );
};

export default Home;

import React from 'react';
import {
  ArrowRight, BarChart3, Bell, Check, ChevronRight, Layers3,
  MapPin, Menu, Satellite, ShieldCheck, X,
} from 'lucide-react';
import { AuthScreen } from '../types';
import logoFull from '../assets/logo-full.png';

interface HomeProps {
  isAuthenticated: boolean;
  onNavigate: (screen: AuthScreen) => void;
}

const sources = ['Carbon Mapper', 'IMEO', 'TROPOMI', 'NASA EMIT'];
const DELTA_BBOX = { west: 4.6, south: 3.3, east: 8.6, north: 6.3 };
const DELTA_MAP_URL = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/%5B${DELTA_BBOX.west},${DELTA_BBOX.south},${DELTA_BBOX.east},${DELTA_BBOX.north}%5D/1280x720@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
const capabilities = [
  { icon: MapPin, number: '01', title: 'See the whole picture', text: 'Explore methane observations, facilities, oil blocks and boundaries in one national map.' },
  { icon: BarChart3, number: '02', title: 'Find the signal', text: 'Compare providers, locations and time periods to surface trends that need investigation.' },
  { icon: Bell, number: '03', title: 'Turn insight into action', text: 'Create alerts, coordinate follow-up and preserve a clear evidence trail for reporting.' },
];
const workflow = [
  { icon: Satellite, label: 'Observe', text: 'Multi-source satellite and field data' },
  { icon: Layers3, label: 'Verify', text: 'One consistent national evidence base' },
  { icon: ShieldCheck, label: 'Act', text: 'Governed alerts, exports and reporting' },
];
const Home: React.FC<HomeProps> = ({ isAuthenticated, onNavigate }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const openPlatform = () => onNavigate(isAuthenticated ? AuthScreen.DASHBOARD : AuthScreen.LOGIN);

  return (
    <main className="h-screen min-h-0 overflow-x-hidden overflow-y-auto bg-[#f4f6f2] text-[#10201d]">
      <section className="relative isolate min-h-[760px] overflow-hidden bg-[#071b18] text-white lg:min-h-[840px]">
        <img src={DELTA_MAP_URL} alt="Map of the Niger Delta oil and gas region" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,24,21,.98)_0%,rgba(5,24,21,.88)_43%,rgba(5,24,21,.28)_78%,rgba(5,24,21,.12)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#051815]/25 via-transparent to-[#051815]/95" />

        <header className="relative z-40 border-b border-white/10">
          <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
            <button type="button" onClick={() => onNavigate(AuthScreen.HOME)} aria-label="NOGIET home" className="rounded-lg bg-white px-3 py-2">
              <img src={logoFull} alt="NOGIET" className="h-7 w-auto" />
            </button>
            <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary navigation">
              <a href="#platform" className="text-xs font-semibold text-white/65 hover:text-white">Platform</a>
              <a href="#workflow" className="text-xs font-semibold text-white/65 hover:text-white">How it works</a>
              <a href="#data" className="text-xs font-semibold text-white/65 hover:text-white">Data sources</a>
              <a href="#partners" className="text-xs font-semibold text-white/65 hover:text-white">Partners</a>
            </nav>
            <div className="flex items-center gap-2">
              <button type="button" onClick={openPlatform} className="group hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur hover:bg-white hover:text-[#071b18] sm:flex">
                {isAuthenticated ? 'Open platform' : 'Sign in'}<ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 lg:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="absolute inset-x-4 top-[88px] rounded-2xl border border-white/10 bg-[#0b2924]/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
              {['platform', 'workflow', 'data', 'partners'].map((item) => (
                <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold capitalize text-white/80 hover:bg-white/10">
                  {item === 'workflow' ? 'How it works' : item}<ChevronRight size={15} />
                </a>
              ))}
              <button type="button" onClick={openPlatform} className="mt-2 w-full rounded-xl bg-[#c9f36b] px-4 py-3 text-sm font-black text-[#071b18]">{isAuthenticated ? 'Open platform' : 'Authorized sign in'}</button>
            </nav>
          )}
        </header>

        <div className="relative mx-auto flex min-h-[680px] max-w-[1440px] flex-col justify-between px-5 pb-8 pt-20 sm:px-8 lg:px-14 lg:pb-10 lg:pt-28">
          <div className="nogiet-home-enter max-w-[760px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d9ff7e] backdrop-blur"><span className="h-2 w-2 rounded-full bg-[#c9f36b]" />National methane intelligence</div>
            <h1 className="mt-7 text-[clamp(3.6rem,7.3vw,7.4rem)] font-black leading-[.88] tracking-[-.07em]">See emissions.<span className="mt-2 block text-[#c9f36b]">Shape action.</span></h1>
            <p className="mt-8 max-w-[610px] text-base leading-8 text-white/70 sm:text-lg">A single, trusted view of methane emissions across Nigeria&rsquo;s oil and gas sector—built for faster understanding and accountable action.</p>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center"><button type="button" onClick={openPlatform} className="group flex items-center gap-4 rounded-full bg-[#c9f36b] px-7 py-4 text-sm font-black text-[#071b18] shadow-[0_18px_50px_rgba(0,0,0,.2)] hover:-translate-y-0.5 hover:bg-white">{isAuthenticated ? 'Open NOGIET' : 'Enter the platform'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></button><span className="flex items-center gap-2 text-xs font-semibold text-white/55"><ShieldCheck size={16} /> Secure access for authorized teams</span></div>
          </div>
          <div className="nogiet-home-enter-delayed mt-16 grid overflow-hidden rounded-2xl border border-white/15 bg-[#061d19]/70 backdrop-blur-xl sm:grid-cols-3 lg:max-w-[850px]">
            {[['4', 'Satellite sources'], ['36', 'States covered'], ['24/7', 'Feed monitoring']].map(([value, label], index) => <div key={label} className={`flex items-center gap-4 px-5 py-4 sm:px-7 ${index > 0 ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}><strong className="text-2xl font-black text-[#c9f36b]">{value}</strong><span className="text-[10px] font-bold uppercase tracking-[.12em] text-white/50">{label}</span></div>)}
          </div>
        </div>
      </section>

      <section id="data" className="border-b border-[#dce2dc] bg-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-14"><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-400">Intelligence from leading observation systems</p><div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:gap-10">{sources.map((source) => <span key={source} className="flex items-center gap-2 text-xs font-black text-[#29443e]"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{source}</span>)}</div></div></section>

      <section id="platform" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">Built for decisive action</p><h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.05em] sm:text-6xl">From a distant signal to a clear next step.</h2><p className="mt-6 max-w-md text-sm leading-7 text-slate-600">NOGIET turns fragmented emissions data into a shared operational picture for regulators, operators and partners.</p></div><div className="divide-y divide-[#cfd8d1] border-y border-[#cfd8d1]">{capabilities.map(({ icon: Icon, number, title, text }) => <article key={title} className="group grid gap-5 py-7 sm:grid-cols-[60px_1fr_auto] sm:items-center sm:py-9"><span className="text-xs font-black text-teal-700">{number}</span><div><h3 className="text-xl font-black tracking-[-.02em] sm:text-2xl">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{text}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#bdcbc1] text-teal-700 transition group-hover:border-teal-700 group-hover:bg-teal-700 group-hover:text-white"><Icon size={20} /></span></article>)}</div></div>
      </section>

      <section id="workflow" className="bg-[#dfe9df] px-5 py-20 sm:px-8 lg:px-14 lg:py-28"><div className="mx-auto max-w-[1440px]"><div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">One connected workflow</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">Observe. Verify. Act.</h2></div><p className="max-w-2xl text-sm leading-7 text-slate-600 lg:justify-self-end">Every observation stays connected to its source, context and follow-up—giving teams confidence in the data and accountability in the response.</p></div><div className="mt-12 grid overflow-hidden rounded-[2rem] bg-[#0a2521] text-white shadow-[0_28px_70px_rgba(7,27,24,.18)] md:grid-cols-3">{workflow.map(({ icon: Icon, label, text }, index) => <article key={label} className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-10 last:border-0"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c9f36b] text-[#071b18]"><Icon size={20} /></span><span className="font-serif text-4xl italic text-white/15">0{index + 1}</span></div><h3 className="mt-14 text-2xl font-black">{label}</h3><p className="mt-2 text-sm leading-6 text-white/50">{text}</p></article>)}</div></div></section>

      <section id="partners" className="bg-white px-5 py-20 sm:px-8 lg:px-14 lg:py-28"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">National regulatory leadership</p><h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-.05em] sm:text-5xl">A shared system, built around public trust.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">A governed environment where national regulators can align observations, evidence and action.</p><div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[#29443e]">{['Traceable data', 'Controlled access', 'Export-ready evidence'].map((item) => <span key={item} className="flex items-center gap-2 rounded-full bg-[#edf3ed] px-4 py-2"><Check size={14} className="text-teal-700" />{item}</span>)}</div></div><div className="grid gap-3 sm:grid-cols-2">{[['/branding/nuprc-logo.png', 'NUPRC', 'Nigerian Upstream Petroleum Regulatory Commission'], ['/branding/nmdpra-logo.png', 'NMDPRA', 'Nigerian Midstream and Downstream Petroleum Regulatory Authority']].map(([src, name, full]) => <article key={name} className="rounded-[1.5rem] border border-[#dbe2dc] bg-[#f6f8f4] p-6"><img src={src} alt={full} className="h-16 w-16 rounded-full bg-white object-contain p-1 shadow-sm" /><h3 className="mt-8 text-xl font-black">{name}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{full}</p></article>)}</div></div></section>

      <section className="bg-[#c9f36b] px-5 py-16 sm:px-8 lg:px-14 lg:py-20"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#31502f]">Secure platform access</p><h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-.045em] text-[#071b18] sm:text-5xl">Nigeria&rsquo;s methane intelligence, together in one place.</h2></div><button type="button" onClick={openPlatform} className="group flex shrink-0 items-center gap-5 self-start rounded-full bg-[#071b18] px-7 py-4 text-sm font-black text-white hover:-translate-y-0.5 hover:bg-teal-900 lg:self-auto">{isAuthenticated ? 'Open NOGIET' : 'Enter the platform'}<ArrowRight size={17} /></button></div></section>
      <footer className="bg-[#071b18] px-5 py-9 text-white sm:px-8 lg:px-14"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><img src={logoFull} alt="NOGIET" className="h-7 w-auto self-start rounded bg-white px-2 py-1" /><div className="text-[10px] leading-5 text-white/40 sm:text-right"><p>&copy; 2026 NOGIET. All rights reserved.</p><p>Sponsored by Stakeholder Democracy Network with support from the Global Methane Hub.</p></div></div></footer>
    </main>
  );
};

export default Home;

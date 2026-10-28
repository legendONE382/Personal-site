import shotAsk from '../assets/shots/askdocs.webp'
import shotVolt from '../assets/shots/voltwatch.webp'
import shotMaritime from '../assets/shots/maritime.webp'
import shotEstech from '../assets/shots/estech.webp'
import shotCopilot from '../assets/shots/copilot.webp'
import shotLumoraHome from '../assets/shots/lumora-home.webp'
import shotLumoraGen from '../assets/shots/lumora-gen.webp'
import shotTrade from '../assets/shots/tradepulse.webp'

/**
 * Studio content.
 *
 * ── Where to swap in your own material ────────────────────────
 *  • Replace the `img` values with your own screenshots / stills.
 *  • Replace `video` with your own clip (mp4 or an HLS url).
 *  • Edit `services`, `stats` and `studio` to match your practice.
 * ───────────────────────────────────────────────────────────────
 */

const RAW = 'https://raw.githubusercontent.com/legendONE382'

export const studio = {
  name: 'Emmanuel Uchenna',
  wordmark: 'Emmanuel Uchenna',
  descriptor: 'Software Studio',
  role: 'Full-Stack Developer | AI Application Developer',
  email: 'ue9938090@gmail.com',
  github: 'https://github.com/legendONE382',
  location: 'Lagos, Nigeria',
  brand: 'Estech Solutions',
  brandUrl: 'https://estech-solutions.vercel.app/',
  portfolio: 'https://programmer-emmanuel.vercel.app/',
  available: 'Open to work — remote',
  response: 'Best reached by email',
}

export type Project = {
  slug: string
  index: string
  title: string
  client: string
  year: string
  discipline: string
  blurb: string
  summary: string
  img: string
  /** optional cleaner image for the full-screen case study */
  hero?: string
  /** how much of the top to crop away (browser chrome in live captures) */
  cropTop: number
  /** how much of the left edge to crop (editor chrome in dev captures) */
  cropLeft?: number
  /** CSS object-position for the card crop (keep left-aligned layouts intact) */
  focus?: string
  accent: string
  stack: string[]
  live?: string
  repo: string
  features: string[]
  architecture: { label: string; note: string }[]
  decisions: string[]
  limitations: string[]
  links: { label: string; href: string }[]
}

export const projects: Project[] = [
  {
    slug: 'lumora',
    index: '01',
    title: 'Lumora AI',
    client: 'Self-initiated',
    year: '2026',
    discipline: 'AI application · Workflow automation · Multimedia',
    blurb: 'A website, product or idea becomes a finished vertical video.',
    summary:
      'An automated content-production pipeline: scrape a URL, plan the story with Gemini, pull real stock media from Pexels, narrate locally with Piper, burn in timed subtitles, mix music and render a 1080×1920 MP4 with FFmpeg.',
    img: shotLumoraHome,
    hero: shotLumoraGen,
    cropTop: 10,
    cropLeft: 5,
    accent: '#2f4bff',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind', 'Gemini API', 'Pexels API', 'Python', 'Piper TTS', 'FFmpeg', 'Docker'],
    repo: 'https://github.com/legendONE382/lumora-',
    features: [
      'Extracts readable content from a URL, or accepts a text idea',
      'Gemini creative plan: script, tone and scene breakdown',
      'Pexels photo and video search per scene, with candidate scoring',
      'Local narration with Piper text-to-speech',
      'Timed subtitles burned into the video frames',
      'Mood-matched background music mixed under the voice',
      'FFmpeg assembly into a vertical H.264 + AAC MP4',
      'Graceful fallbacks for AI failures and missing media',
    ],
    architecture: [
      { label: 'URL or text idea', note: 'The workspace drives each stage and reports live progress.' },
      { label: '/api/extract', note: 'Scrapes title, description and body text, then creates the project.' },
      { label: '/api/generate-plan', note: 'Gemini 2.5 Flash with a response schema; a local plan is the fallback.' },
      { label: '/api/generate-visual', note: 'Pexels photos and videos, up to three queries per scene, cached per run.' },
      { label: '/api/generate-audio', note: 'Piper runs locally — one WAV per scene, no API cost.' },
      { label: '/api/render-video', note: 'FFmpeg: scene clips → concat → subtitles → music mix → MP4.' },
      { label: '/api/video/[id]', note: 'Streams the finished file with +faststart for instant playback.' },
    ],
    decisions: [
      'Only two external services — Gemini and Pexels. Narration, captions and encoding run locally, so nothing else costs per video.',
      'Captions are burned into the pixels with FFmpeg’s subtitles filter so they survive every player and re-upload.',
      'Each render stage lives in its own function, which keeps failures easy to isolate and diagnose.',
      'The Docker image bundles FFmpeg with libass, Python and Piper, and fails the build if the subtitles filter is missing.',
    ],
    limitations: [
      'A working prototype — it runs locally or as a Docker service rather than a hosted product.',
      'Generated media is written to an ephemeral tmp/ folder, so redeploys wipe it without a mounted disk.',
      'Server project stores are process-bound, so state can lag across restarts.',
      'Long renders run inside the HTTP request.',
    ],
    links: [
      { label: 'GitHub repository', href: 'https://github.com/legendONE382/lumora-' },
      { label: 'Interactive walkthrough', href: 'https://app.arcade.software/share/EGNtrTpGzBfmLvAvavbS' },
      { label: 'Example output video', href: `${RAW}/lumora-/main/public/demo/example.mp4` },
    ],
  },
  {
    slug: 'tradepulse',
    index: '02',
    title: 'TradePulse',
    client: 'Small business tool',
    year: '2026',
    discipline: 'Full-stack · Business software · PWA',
    blurb: 'Money, customers and stock for people who sell on the street.',
    summary:
      'A mobile-first business manager for small sellers, freelancers and shop owners: sales, expenses, customers, debts, invoices, reminders and inventory — installable as a PWA and backed by Supabase.',
    img: shotTrade, // pre-cropped to the dashboard: no browser chrome, no account header
    cropTop: 0,
    accent: '#1f7a4d',
    stack: ['React', 'JavaScript', 'Vite', 'Tailwind CSS', 'React Router', 'Supabase', 'vite-plugin-pwa', 'Vercel'],
    live: 'https://trade-pulse-rose.vercel.app',
    repo: 'https://github.com/legendONE382/Trade-Pulse',
    features: [
      'Sales tracking with customer association and date reporting',
      'Expense logging with categories and date filtering',
      'Customer records with phone, email and notes',
      'Debt and repayment tracking',
      'Invoice creation, download and WhatsApp sharing',
      'Payment reminders with customer links',
      'Product inventory with low-stock alerts',
      'Installable PWA with a mobile-first layout',
    ],
    architecture: [
      { label: 'React app (Vite)', note: 'Routes with a protected-route wrapper.' },
      { label: 'Eight screens', note: 'Dashboard · Sales · Expenses · Customers · Products · Debts · Invoices · Reminders.' },
      { label: 'supabaseStorage.js', note: 'Query helpers isolate every data access from the UI.' },
      { label: 'Supabase', note: 'Authentication and database storage.' },
      { label: 'PWA layer', note: 'Installable on supported browsers via vite-plugin-pwa.' },
    ],
    decisions: [
      'Supabase for auth and storage, so there is no custom backend to keep running.',
      'A PWA, so owners install it from the browser instead of an app store.',
      'WhatsApp share links for invoices and reminders — they open a pre-filled chat, nothing is sent automatically.',
      'Mobile-first layout, because the work happens on a phone during the day.',
    ],
    limitations: [
      'WhatsApp support is link-based sharing only — there is no automated messaging.',
      'Persistence and authorization need an end-to-end check before real business use.',
      'Some mobile browsers still require a manual “Add to Home Screen”.',
    ],
    links: [
      { label: 'Live demo', href: 'https://trade-pulse-rose.vercel.app' },
      { label: 'GitHub repository', href: 'https://github.com/legendONE382/Trade-Pulse' },
    ],
  },
  {
    slug: 'askdocs',
    index: '03',
    title: 'AskDocs',
    client: 'Self-initiated',
    year: '2026',
    discipline: 'AI application · Document intelligence · RAG',
    blurb: 'Upload your documents, ask a question, get an answer with sources.',
    summary:
      'A document question-answering app: upload PDF, DOCX, TXT, Markdown or CSV, and the system parses, chunks, retrieves and answers strictly from your own files — citing the chunks it used.',
    img: shotAsk,
    cropTop: 0,
    accent: '#b45309',
    stack: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'Gemini API', 'pdf-parse', 'mammoth'],
    live: 'https://askdocs-nine.vercel.app/',
    repo: 'https://github.com/legendONE382/Askdocs',
    features: [
      'Username/password sign-up and sign-in',
      'Protected workspace gated by a session cookie',
      'Multi-file upload across five formats',
      'Chunking with overlap and term-frequency ranking',
      'Gemini answers grounded in retrieved text',
      'Source references returned with every answer',
      'Extractive fallback when AI generation is unavailable',
      'Health-check endpoint and documented API routes',
    ],
    architecture: [
      { label: 'Upload', note: 'Up to five files per request, 8 MB each.' },
      { label: 'Parse', note: 'pdf-parse for PDF, mammoth for DOCX, plain text for TXT / MD / CSV.' },
      { label: 'Chunk', note: 'Roughly 900 characters with 140 characters of overlap.' },
      { label: 'In-memory store', note: 'Chunks held per project — lost when the server restarts.' },
      { label: 'Retrieve', note: 'The question is tokenised and chunks are scored by term frequency.' },
      { label: 'Answer', note: 'Gemini grounded in context, or a local extractive answer.' },
      { label: 'Response + sources', note: 'The answer text with the chunks it came from.' },
    ],
    decisions: [
      'Keyword retrieval with term-frequency scoring: simple, transparent and easy to debug.',
      'Overlapping chunks so context survives boundaries.',
      'A system instruction that limits Gemini to the supplied context and asks for citations.',
      'An extractive fallback keeps the app useful without an API key or when the API fails.',
      'Stateless signed session tokens, so no session store is needed.',
    ],
    limitations: [
      'Accounts and document chunks are not persisted across restarts — demo mode.',
      'Keyword retrieval, not semantic search. There is no vector database.',
      'AI answers need a Gemini API key; without it only extractive answers are available.',
      'Rate-limit counters live in memory and are not shared across instances.',
    ],
    links: [
      { label: 'Live demo', href: 'https://askdocs-nine.vercel.app/' },
      { label: 'GitHub repository', href: 'https://github.com/legendONE382/Askdocs' },
    ],
  },
  {
    slug: 'voltwatch',
    index: '04',
    title: 'VoltWatch AI',
    client: 'Simulation study',
    year: '2026',
    discipline: 'Python · Django · Monitoring dashboard',
    blurb: 'Electrical telemetry, threshold alerts and AI-written response guidance.',
    summary:
      'A monitoring-dashboard simulation that generates electrical telemetry for Lagos grid locations, flags readings that cross configured thresholds, and asks a Django proxy for AI-written incident guidance.',
    img: shotVolt,
    cropTop: 0,
    focus: '0% 0%',
    accent: '#0891b2',
    stack: ['Python', 'Django', 'JavaScript', 'Tailwind CSS', 'Requests', 'Mistral API', 'WhiteNoise', 'Vercel'],
    live: 'https://volt-watch-ai.vercel.app',
    repo: 'https://github.com/legendONE382/VoltWatch-AI',
    features: [
      'Simulated voltage, current and temperature readings',
      'Thresholds: temperature above 95 °C, voltage above 260 V',
      'Regional status indicators and live KPIs',
      'Telemetry history kept in the browser',
      'Manual incident injection panel',
      'AI incident analysis through a backend proxy to Mistral',
      'Read-aloud playback of dispatch guidance',
      'Stateless server — no ORM models or migrations',
    ],
    architecture: [
      { label: 'Browser simulation loop', note: 'Random location with voltage, current and temperature.' },
      { label: 'Threshold check', note: 'An anomaly when temperature > 95 °C or voltage > 260 V.' },
      { label: 'POST /api/telemetry/', note: 'Django validates the JSON and detects automated vs manual payloads.' },
      { label: 'Prompt builder', note: 'A prompt tailored to the event type.' },
      { label: 'Mistral Chat Completions', note: 'mistral-small-latest, called with a server-side key.' },
      { label: '{ dispatch, type }', note: 'Rendered in the dashboard, optionally read aloud.' },
      { label: 'localStorage', note: 'History saved under voltwatch_logs_v2.' },
    ],
    decisions: [
      'Thresholds are evaluated in the browser, which keeps the server stateless.',
      'A Django proxy keeps the Mistral API key on the server.',
      'localStorage gives per-browser history without a database.',
      'Two payload shapes — automated and manual — each get their own prompt.',
      'Read-aloud playback for accessibility in a control-room setting.',
    ],
    limitations: [
      'A simulation — no real sensors and no operational data.',
      'No persistence beyond the browser, and no authentication or roles.',
      'Not a substitute for real operational-technology or emergency systems.',
    ],
    links: [
      { label: 'Live demo', href: 'https://volt-watch-ai.vercel.app' },
      { label: 'GitHub repository', href: 'https://github.com/legendONE382/VoltWatch-AI' },
    ],
  },
]

export type Service = {
  index: string
  title: string
  short: string
  summary: string
  stack: string[]
  related: { label: string; slug?: string; href?: string }[]
  glyph: 'cube' | 'wave' | 'grid' | 'flow' | 'orbit' | 'stack'
}

export const services: Service[] = [
  {
    index: '01',
    title: 'AI application development',
    short: 'Grounded answers, retrieval and fallbacks that fail honestly.',
    summary:
      'Language models wired into products that need to reason over your data — grounded answers, retrieval, structured output, fallbacks and honest error handling when a provider misbehaves.',
    stack: ['Gemini API', 'Groq API', 'Mistral API', 'RAG', 'Prompt design', 'Structured outputs', 'Chunking & retrieval', 'Source attribution'],
    related: [
      { label: 'Lumora AI', slug: 'lumora' },
      { label: 'AskDocs', slug: 'askdocs' },
      { label: 'VoltWatch AI', slug: 'voltwatch' },
    ],
    glyph: 'orbit',
  },
  {
    index: '02',
    title: 'Business software & dashboards',
    short: 'Sales, stock and customers on a phone, with a real database.',
    summary:
      'The unglamorous work that makes a business usable on a phone: sales, expenses, customers, debts, invoices and stock — with a database behind it and data that survives a refresh.',
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'PWA', 'Row-level security'],
    related: [
      { label: 'TradePulse', slug: 'tradepulse' },
    ],
    glyph: 'grid',
  },
  {
    index: '03',
    title: 'Frontend engineering',
    short: 'Responsive, accessible interfaces with purposeful motion.',
    summary:
      'Interfaces that feel considered at every width — component architecture, real responsive behaviour, accessible focus states and motion that supports the content instead of decorating it.',
    stack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Three.js', 'Lenis', 'Accessibility'],
    related: [
      { label: 'TradePulse', slug: 'tradepulse' },
      { label: 'AskDocs', slug: 'askdocs' },
    ],
    glyph: 'cube',
  },
  {
    index: '04',
    title: 'Backend & APIs',
    short: 'Validated inputs, predictable errors, documented routes.',
    summary:
      'Servers, routes and storage that do one job well: validated inputs, predictable errors, authenticated sessions and documentation that lets the next person pick it up.',
    stack: ['Python', 'Django', 'Node.js', 'Express', 'REST APIs', 'Auth & sessions', 'File uploads', 'Validation'],
    related: [
      { label: 'VoltWatch AI', slug: 'voltwatch' },
      { label: 'AskDocs', slug: 'askdocs' },
    ],
    glyph: 'stack',
  },
  {
    index: '05',
    title: 'Automation & multimedia',
    short: 'Scrape, plan, narrate, caption and render — automatically.',
    summary:
      'Pipelines that remove a repetitive manual step: scrape, plan, generate, narrate, caption and render — with fallbacks so one failed request never kills the run.',
    stack: ['FFmpeg', 'Piper TTS', 'Pexels API', 'Video pipelines', 'Subtitles', 'Media processing', 'Docker'],
    related: [{ label: 'Lumora AI', slug: 'lumora' }],
    glyph: 'wave',
  },
  {
    index: '06',
    title: 'Interactive & 3D',
    short: 'WebGL and physics for things that should be felt.',
    summary:
      'WebGL and browser physics when the interface needs to be felt rather than read — real-time scenes, draggable objects and motion tied to the scroll position.',
    stack: ['Three.js', 'GLSL', 'Physics', 'Rapier-ready', 'Game state', 'Browser storage'],
    related: [{ label: 'This playground', href: '#playground' }],
    glyph: 'flow',
  },
]

export const stats = [
  { n: 7, label: 'Public repositories', note: 'Source for every project' },
  { n: 5, label: 'Live deployments', note: 'All verified and linked' },
  { n: 4, label: 'Documented case studies', note: 'Architecture and trade-offs' },
  { n: 3, label: 'AI providers integrated', note: 'With fallbacks and guards' },
]

export const proofs = [
  { label: 'READMEs + .env.example', note: 'Setup steps and environment templates in every repo' },
  { label: 'Automated tests', note: 'npm test, lint, type-check and build scripts (AskDocs)' },
  { label: 'Docker image w/ FFmpeg', note: 'The build fails if the subtitles filter is missing' },
  { label: 'Row-level security', note: 'Supabase auth with per-user policies (TradePulse)' },
  { label: 'Signed session cookies', note: 'HMAC-SHA256 tokens with a 12-hour expiry (AskDocs)' },
  { label: 'Validated AI proxy', note: 'Server-side key handling and payload checks (VoltWatch)' },
]

export const timeline = [
  {
    role: 'Founder & Software Developer',
    org: 'Estech Solutions',
    dates: 'Ongoing',
    note: 'An independent studio brand: programming instruction, websites, web applications and AI-assisted business software.',
    points: [
      'Develops and maintains the Estech Solutions presence and website.',
      'Builds web applications, business software and client demonstrations.',
      'Explores AI-enabled workflow and business-automation applications.',
      'Handles implementation, deployment and technical documentation.',
    ],
  },
  {
    role: 'Programming Instructor / IT-SIWES Trainee',
    org: 'GIIT Africa',
    dates: 'May 2026 – September 2026',
    note: 'Programming instruction and practical training, with primary responsibility for Python.',
    points: [
      'Handled Python instruction: types, functions, OOP, exceptions and f-strings.',
      'Delivered introductory Django training with practical exercises.',
      'Supported students with HTML, CSS, JavaScript, React and Node.js.',
      'Mentored students through debugging and a console Student Management System.',
    ],
  },
]

export const marq = ['AI Applications', 'Business Software', 'Document Intelligence', 'Workflow Automation', 'Interactive 3D', 'Deployment']

/* ═══════════════════════════════════════════════════════════
   EXTENSION CONTENT
   ═══════════════════════════════════════════════════════════ */

export type MoreProject = {
  title: string
  kind: string
  status: string
  tone: 'live' | 'source' | 'wip'
  blurb: string
  stack: string[]
  /** a live capture; falls back to a drawn tile if it fails to load */
  img?: string
  fallbackImg?: string
  links: { label: string; href: string }[]
}

/** Smaller projects. Swap images/links here. */
export const more: MoreProject[] = [
  {
    title: 'Maritime Shipping Simulator',
    kind: 'Interactive · Three.js',
    status: 'Live demo',
    tone: 'live',
    blurb:
      'A browser maritime simulation: steer a vessel, take cargo missions, handle weather and hazards, and upgrade your ship. Touch-friendly controls and local save data.',
    stack: ['React', 'TypeScript', 'Vite', 'Three.js'],
    img: shotMaritime,
    links: [
      { label: 'Play it', href: 'https://mssocean.vercel.app/' },
      { label: 'Source', href: 'https://github.com/legendONE382/maritime-shipping-simulator' },
    ],
  },
  {
    title: 'Estech Solutions website',
    kind: 'Business website · SEO',
    status: 'Live site',
    tone: 'live',
    blurb:
      'The responsive brand site for Estech Solutions: industry landing pages, a productivity estimator, structured data, sitemap and robots directives, and enquiry workflows.',
    stack: ['HTML5', 'CSS', 'Bootstrap', 'JavaScript', 'Schema.org'],
    img: shotEstech,
    links: [
      { label: 'Visit site', href: 'https://estech-solutions.vercel.app/' },
      { label: 'Source', href: 'https://github.com/legendONE382/ESTECH-SOLUTIONS' },
    ],
  },
  {
    title: 'EchoScribe AI',
    kind: 'AI content · Audio',
    status: 'Source only',
    tone: 'source',
    blurb:
      'Turns audio recordings into profession-specific written content: transcription, social posts, newsletter outlines and key themes, behind an Express backend with file uploads.',
    stack: ['Node.js', 'Express', 'Groq API', 'Hugging Face', 'Multer'],
    links: [{ label: 'Source', href: 'https://github.com/legendONE382/echoscribe-ai' }],
  },
  {
    title: 'Estech AI Copilot Business',
    kind: 'AI business software',
    status: 'In development',
    tone: 'wip',
    blurb:
      'A business workspace concept for company knowledge, customer conversations and document generation. The Tasks workflow and knowledge-table authorization are still being completed.',
    stack: ['Next.js', 'Supabase', 'pgvector', 'Gemini · Groq · Mistral', 'Tavily'],
    img: shotCopilot,
    links: [{ label: 'Open the app', href: 'https://business.estech.dedyn.io/' }],
  },
]

export const toolbox: { title: string; items: string[]; seen: { label: string; slug?: string; href?: string }[] }[] = [
  {
    title: 'Frontend',
    items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Vite', 'Progressive Web Apps', 'GSAP', 'Three.js'],
    seen: [
      { label: 'TradePulse', slug: 'tradepulse' },
      { label: 'Lumora AI', slug: 'lumora' },
      { label: 'AskDocs', slug: 'askdocs' },
    ],
  },
  {
    title: 'Backend',
    items: ['Python', 'Django', 'Node.js', 'Express', 'REST APIs', 'Authentication & sessions', 'File uploads', 'Request validation', 'Error handling'],
    seen: [
      { label: 'VoltWatch AI', slug: 'voltwatch' },
      { label: 'AskDocs', slug: 'askdocs' },
    ],
  },
  {
    title: 'Data & storage',
    items: ['PostgreSQL', 'Supabase', 'SQLite', 'SQL', 'Row-level security', 'Data modelling', 'Browser storage'],
    seen: [
      { label: 'TradePulse', slug: 'tradepulse' },
      { label: 'VoltWatch AI', slug: 'voltwatch' },
    ],
  },
  {
    title: 'AI',
    items: ['Gemini API', 'Groq API', 'Mistral API', 'Prompt design', 'Structured outputs', 'Retrieval (RAG)', 'Chunking', 'Source attribution', 'Provider fallbacks'],
    seen: [
      { label: 'Lumora AI', slug: 'lumora' },
      { label: 'AskDocs', slug: 'askdocs' },
      { label: 'VoltWatch AI', slug: 'voltwatch' },
    ],
  },
  {
    title: 'Media & automation',
    items: ['FFmpeg', 'Piper TTS', 'Pexels API', 'Subtitle generation', 'Audio / video processing', 'Multi-stage pipelines'],
    seen: [{ label: 'Lumora AI', slug: 'lumora' }],
  },
  {
    title: 'Tools & delivery',
    items: ['Git', 'GitHub', 'npm', 'Docker', 'Vercel', 'Environment configuration', 'Debugging', 'Testing', 'Documentation'],
    seen: [
      { label: 'Lumora AI', slug: 'lumora' },
      { label: 'AskDocs', slug: 'askdocs' },
    ],
  },
]

export const process = [
  {
    step: 'Understand',
    text: 'Who is it for, what problem does it solve, and what are the real constraints?',
    example: 'AskDocs: answers had to come from the user’s own files, so source references became a requirement.',
  },
  {
    step: 'Plan',
    text: 'Decide the features, the user flow, the architecture and the smallest sensible stack.',
    example: 'Lumora: the pipeline was split into separate API stages so each one can fail and be diagnosed alone.',
  },
  {
    step: 'Build',
    text: 'Write the interface, the backend, the data layer and the integrations.',
    example: 'TradePulse: eight screens over a single set of Supabase helpers, installable as a PWA.',
  },
  {
    step: 'Test',
    text: 'Check the important workflows, validate inputs and make errors understandable.',
    example: 'AskDocs: unit tests plus lint, type-check and build scripts.',
  },
  {
    step: 'Deploy',
    text: 'Configure the environment, ship it, and fix what only shows up in production.',
    example: 'VoltWatch: Django on Vercel through WSGI routing, with the API key held in an environment variable.',
  },
  {
    step: 'Refine',
    text: 'Improve what testing and real use reveal, and write the limitations down.',
    example: 'Lumora: Gemini failures fall back to a local plan; a scene with no media still renders.',
  },
]

export const faq = [
  {
    q: 'Are you available for work right now?',
    a: 'Yes. I am open to remote software development roles, full-stack and AI application work, engineering collaborations, website and web-app projects, and programming instruction.',
  },
  {
    q: 'What do you build best?',
    a: 'Full-stack web applications with a database behind them, AI-powered tools (document question-answering, content pipelines, dashboards), and business software that works on a phone. The four featured projects show each of these.',
  },
  {
    q: 'Are the projects production services?',
    a: 'They are labelled honestly. TradePulse, AskDocs and VoltWatch are deployed demonstrations, Lumora AI is a working prototype, and VoltWatch is a simulation. Every case study lists its current limitations next to what it can do.',
  },
  {
    q: 'Which technologies do you work with?',
    a: 'React, Next.js and TypeScript on the front; Python with Django and Node with Express on the back; Supabase and PostgreSQL for data; and Gemini, Groq and Mistral for AI. The toolbox section lists all of it and links each area to a project that uses it.',
  },
  {
    q: 'What is your background?',
    a: 'I run Estech Solutions, an independent brand for web applications and AI-enabled business software. Between May and September 2026 I also worked as a programming instructor and IT-SIWES trainee at GIIT Africa, mainly teaching Python and Django.',
  },
  {
    q: 'How do I get in touch?',
    a: 'Use the form below or email ue9938090@gmail.com directly. A short description of the role or project, and any timeline, is the most useful thing to include.',
  },
]

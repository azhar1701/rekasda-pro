# 🤖 RekaSDA Pro: Master Frontend Engineering Guide for AI Agents

**CONTEXT:** You are an autonomous AI Frontend Engineer and UI/UX Designer working on **RekaSDA Pro**, a professional Water Resources Engineering Platform for Indonesian civil engineers. 

This document is your single source of truth for the application's architecture, page structure, design system, and component rules. **You MUST adhere strictly to these guidelines whenever you build, modify, or refactor anything in this project.**

---

## 🏛️ PART 1: Core Philosophy & Application Structure

### 1.1 Design Philosophy
- **Identity:** Government/Professional (Kementerian PUPR).
- **Vibe:** Clean, authoritative, data-dense but readable, "quiet" (no excessive colors/animations).
- **Hierarchy:** High-density data matrices require strict tabular alignment. White space is used for breathing room between sections.

### 1.2 Global Layout (`App.tsx`)
The application uses a persistent global layout wrapping all routes. When building a new page, you do not need to build the Header/Nav/Footer; they are handled globally.

```tsx
<BrowserRouter>
  <OnboardingProvider>
    <SideDrawer />           {/* Global side navigation/drawer */}
    <ToastContainer />       {/* Global feedback toast */}
    
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />             {/* Top PUPR-branded header */}
      
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-28 md:pt-24">
        <Routes>
           {/* Individual Feature Modules loaded here */}
        </Routes>
      </main>

      <nav> {/* Global Navigation (Desktop Horizontal / Mobile Bottom) */} </nav>
      <Footer />             {/* Desktop-only formal footer */}
      <AIConsultantDrawer /> {/* Persistent AI Sidebar */}
    </div>
  </OnboardingProvider>
</BrowserRouter>
```

### 1.3 Routing & Modules (The 4 Phases)
The app is divided into 4 logical workflow phases:
1. **Input:** `/workflow` (Canvas), `/master` (Data Master - SSOT for Luas DAS and Rainfall)
2. **Analysis:** `/frekuensi` (Statistics), `/banjir` (Flood Hydrographs), `/neraca` (Water Balance)
3. **Design:** `/embung` (Small Dams), `/saluran` (Hydraulics)
4. **Output:** `/history` (Saved DB items), `/exec` (Summary & PDF Report)

---

## 📐 PART 2: UI/UX Layout Patterns

### 2.1 The Standard Page Wrapper (`ModuleLayout`)
**EVERY** primary feature module MUST be wrapped in the `ModuleLayout` component.

```tsx
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export const MyFeaturePage = () => {
  return (
    <ModuleLayout
      title="Module Name"
      description="Clear, concise description"
      icon={<LucideIcon className="w-6 h-6" />}
      iconColorClass="bg-pupr-blue text-white"
      sniCode="SNI XXXX:XXXX" // Displays standard compliance badge
      actions={<button>Export/Action</button>}
    >
      {/* Page Content Here */}
    </ModuleLayout>
  );
};
```

### 2.2 The Asymmetrical Grid Layout (`lg:grid-cols-12`)
Most calculation pages stack on mobile, but split 5/7 or 4/8 on desktop:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* LEFT: Inputs & Configurations (4 or 5 cols) */}
  <div className="lg:col-span-5 flex flex-col gap-4">
     <Collapsible title="Parameter"> ... </Collapsible>
  </div>
  
  {/* RIGHT: Visualizations & Results (7 or 8 cols) */}
  <div className="lg:col-span-7 flex flex-col gap-6">
     <div className="glass-card p-6"> Chart </div>
     <div className="glass-card p-6"> Data Table </div>
  </div>
</div>
```

---

## 🎨 PART 3: Design Tokens & Typography

**DO NOT invent new hex codes.** Use these exact Tailwind utility classes.

### 3.1 Colors
- **Primary Brand:** `bg-pupr-blue`, `text-pupr-blue`, `border-pupr-blue` (Maps to `#0c3a66`)
- **Accent Brand:** `text-pupr-yellow` (Maps to `#f2c114`)
- **Surfaces:** `bg-slate-50` (disabled inputs/app background), `bg-white` (cards)
- **Typography:** `text-slate-900` (Titles), `text-slate-700` (Body), `text-slate-500` (Labels)
- **Semantic Badges:** 
  - Water/Embung: `bg-teal-50 text-teal-600`
  - Rain/Flood: `bg-blue-50 text-blue-600`
  - Balance/Success: `bg-green-50 text-green-600`
  - Error: `bg-red-50 text-red-600`

### 3.2 Spacing System (Strict 8px Grid)
- **Icons/Tight:** `gap-1` (4px), `gap-2` (8px)
- **Label to Input:** `gap-3` (12px)
- **Between Elements:** `gap-4` (16px)
- **Card Padding / Section Gaps:** `p-6` (24px) or `gap-6`

### 3.3 Typography Rules (Plus Jakarta Sans)
- **Data Displays:** `text-4xl` or `text-5xl font-light tracking-tight tabular-nums`
- **Form Labels / Table Headers:** `text-[10px] font-bold text-slate-500 uppercase tracking-wider` (CRITICAL for the GovTech look)
- **Body Text:** `text-sm text-slate-700`

---

## 🧱 PART 4: Component Construction Blueprints

When building individual UI elements, follow these exact patterns:

### 4.1 Cards (`StandardCard` structure)
Every card must have:
- `bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow duration-200`
- **Header:** `px-6 py-5 border-b border-slate-100` (optional: `bg-gradient-to-r from-slate-50 to-white`)
- **Body:** `p-6`

### 4.2 Inputs & Buttons (The 44px Rule)
- All text inputs, selects, and standard buttons MUST be `h-11` (44px) for touch targets.
- **Border Radius:** `rounded-lg` (8px). (Note: Cards are `rounded-xl` / 12px).
- **Primary Button:** `h-11 px-6 bg-pupr-blue hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors`
- **Secondary Button:** `h-11 px-4 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50`

### 4.3 SSOT Read-only Pattern
If data is inherited from `/master` (like Luas DAS), lock the input:
- Use `bg-slate-50 cursor-not-allowed`
- Include a lock icon
- Add a tiny label underneath indicating the source (e.g., "Source: Master Data")

### 4.4 Data Matrices (Tables)
Always wrap engineering data tables in this distinct container:
```tsx
<div className="bg-white rounded-sm border border-slate-200 overflow-hidden">
  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
    <h3 className="text-sm font-bold text-slate-800">Table Title</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead className="bg-slate-50">
        <tr>
          {/* text-[10px] font-bold text-slate-500 uppercase tracking-wider */}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {/* Zebra stripe: even:bg-slate-50 hover:bg-slate-50 transition-colors */}
        {/* Data cells MUST use: tabular-nums tracking-tight text-right */}
      </tbody>
    </table>
  </div>
</div>
```

---

## ⛔ PART 5: Anti-Patterns (NEVER DO THESE)

1. **NO Magic Margins/Paddings:** Do not use `p-3`, `p-5`, `p-7`. Always snap to the 8px grid (`p-4` or `p-6`).
2. **NO Messy Heights:** Do not mix `h-8`, `h-10`, `h-12` for interactive forms. Use `h-11`.
3. **NO Loud Backgrounds:** Do not use solid bright red/green backgrounds. Use the soft `bg-red-50 text-red-600` pattern.
4. **NO Casual Labels:** Form labels and table headers MUST be `uppercase tracking-wider text-[10px]`. Sentence case looks like a startup, not a government engineering tool.
5. **NO Shifting Decimals:** Engineering data MUST use `tabular-nums`. Decimal points must perfectly align vertically in tables.
6. **NO Isolated Features:** Ensure every new calculation module passes data to `useHydrologyStore` so it can be picked up by the Executive Dashboard (`/exec`).

***

**FINAL AI SELF-CHECK:** Before outputting UI code, ask yourself: *"Does this look like a highly precise, data-dense engineering dashboard built for the Indonesian Government?"* If it feels too playful or inconsistent, rewrite it using the exact tokens above.

# 💧 RekaSDA Pro

**Professional Water Resources Engineering Platform**

Modern web application for hydrological analysis compliant with Indonesian National Standards (SNI).

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

RekaSDA Pro eliminates manual calculation errors and accelerates hydrological workflows for Indonesian civil engineers with:

- ✅ SNI-compliant calculations
- ✅ Production-grade accuracy
- ✅ Mobile-first design
- ✅ AI-powered insights
- ✅ Interactive mapping

---

## 🌊 Features

### Flood Analysis
Calculate design flood discharge using:
- Rational Method (watersheds <5000 ha)
- HSS Nakayasu (unit hydrograph)
- Frequency Analysis (Log Pearson III & Gumbel)
- Return periods: Q2, Q5, Q10, Q25, Q50, Q100

**Standard**: SNI 2415:2016

### Channel Analysis
Hydraulic capacity for open channels:
- Manning's Equation
- Geometric analysis (trapezoidal, rectangular, circular)
- Flow regime classification
- Freeboard safety check

**Standard**: SNI 03-3424-1994

### Water Balance
Supply vs. demand analysis:
- Monthly balance (12-month)
- Dependable flow (Q80)
- Domestic & irrigation demand
- Environmental flow (10% rule)
- Critical month identification

**Standards**: SNI 19-6728.1-2002, SNI 6738:2015

### AI Consultant
Gemini-powered virtual assistant:
- Context-aware analysis
- SNI compliance verification
- Design recommendations
- Natural language Q&A

### Interactive Mapping
Spatial visualization:
- Leaflet + OpenStreetMap
- Color-coded markers (Blue: Channel, Red: Flood, Green: Water Balance)
- Click-to-view details
- List/Map toggle

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org/))
- npm 8+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/rekasda-pro.git
cd rekasda-pro

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI (Optional)
VITE_API_KEY=your-gemini-api-key
```

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

**Frontend**
- React 18.3 + TypeScript 5.9
- Vite 7.3
- Tailwind CSS 3.4
- Lucide React

**Visualization**
- Recharts 2.10
- Leaflet 1.9

**Backend**
- Supabase (PostgreSQL + Auth)
- Zod 3.23

**AI**
- Google Gemini API

---

## 📁 Project Structure

```
rekasda-pro/
├── public/              # Static assets
├── src/
│   ├── features/        # Feature modules
│   │   ├── channel-analysis/
│   │   ├── flood-analysis/
│   │   ├── water-balance/
│   │   ├── history/
│   │   └── ai-consultant/
│   ├── components/      # Reusable UI
│   ├── lib/            # Core libraries
│   ├── services/       # API & business logic
│   ├── hooks/          # Custom hooks
│   └── types/          # TypeScript definitions
├── docs/               # Documentation
└── database/           # SQL schemas
```

---

## 🏛️ SNI Compliance

| Standard | Application |
|----------|-------------|
| SNI 2415:2016 | Flood discharge calculations |
| SNI 6738:2015 | Dependable flow analysis |
| SNI 19-6728.1-2002 | Water balance methodology |
| SNI 03-7065-2005 | Domestic water demand |
| SNI 03-3424-1994 | Open channel hydraulics |

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 🗺️ Roadmap

**v1.1 (Q1 2025)**
- PDF report generation
- Excel export with formulas
- Multi-user collaboration

**v1.2 (Q2 2025)**
- Real-time sensor integration
- Advanced GIS features
- Mobile native apps

**v2.0 (Q3 2025)**
- Multi-language support
- Machine learning predictions
- Government integration

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Guidelines**:
- Follow existing code style
- Write meaningful commits
- Update documentation
- Ensure SNI compliance

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

**Third-Party**:
- React: MIT
- Leaflet: BSD 2-Clause
- Supabase: Apache 2.0
- Tailwind CSS: MIT

---

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/yourusername/rekasda-pro/issues)
- 💬 [Discussions](https://github.com/yourusername/rekasda-pro/discussions)
- 📧 support@rekasda.pro

---

## 🌟 Acknowledgments

- **Badan Standardisasi Nasional (BSN)** - SNI standards
- **Kementerian PUPR** - Technical guidance
- **Indonesian Water Resources Engineers** - Field testing
- **Open Source Community** - Amazing tools

---

<div align="center">

**Built with ❤️ for Indonesian Water Resources Engineers**

[⬆ Back to Top](#-rekasda-pro)

</div>

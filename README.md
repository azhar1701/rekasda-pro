<div align="center">

# 💧 RekaSDA Pro

**Rekayasa Sumber Daya Air - Professional Water Resources Engineering Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](https://github.com)

*Production-grade hydrological analysis tool compliant with Indonesian National Standards (SNI)*

[Features](#-key-features) • [Installation](#-getting-started) • [Documentation](docs/) • [Contributing](#-contributing)

</div>

---

## 📋 About The Project

### The Problem

Water resources engineers in Indonesia face critical challenges:
- ❌ Manual calculations prone to human error
- ❌ Time-consuming repetitive computations
- ❌ Difficulty ensuring SNI compliance
- ❌ Limited access to field-ready digital tools
- ❌ Lack of spatial visualization for project data

### The Solution: RekaSDA Pro

**RekaSDA Pro** is a specialized web application designed to eliminate calculation errors and accelerate hydrological analysis workflows. Built specifically for Indonesian civil engineers, it provides:

✅ **SNI-Compliant Calculations** - All formulas strictly follow national standards  
✅ **Production-Grade Accuracy** - Validated against manual calculations  
✅ **Mobile-First Design** - Field-ready data collection on tablets/phones  
✅ **AI-Powered Insights** - Virtual consultant for expert recommendations  
✅ **Spatial Visualization** - Interactive maps for project management  

### 🏛️ Regulatory Compliance

RekaSDA Pro adheres to the following Indonesian National Standards:

| Standard | Title | Application |
|----------|-------|-------------|
| **SNI 2415:2016** | Tata Cara Perhitungan Debit Banjir Rencana | Flood discharge calculations |
| **SNI 6738:2015** | Perhitungan Debit Andalan Sungai | Dependable flow analysis |
| **SNI 19-6728.1-2002** | Penyusunan Neraca Sumber Daya Air | Water balance methodology |
| **SNI 03-7065-2005** | Tata Cara Perencanaan Sistem Penyediaan Air Minum | Domestic water demand |
| **SNI 03-3424-1994** | Tata Cara Perencanaan Drainase Permukaan Jalan | Open channel hydraulics |

Endorsed by **Kementerian PUPR** (Ministry of Public Works and Housing) standards.

---

## ✨ Key Features

### 🌊 Flood Analysis Module
Calculate design flood discharge using industry-standard methods:
- **Rational Method** - For small watersheds (<5000 ha)
- **HSS Nakayasu** - Unit hydrograph for larger catchments
- **Frequency Analysis** - Log Pearson III & Gumbel distributions
- **Return Period Calculations** - Q2, Q5, Q10, Q25, Q50, Q100
- **Hydrograph Visualization** - Interactive charts with Recharts

**Compliance**: SNI 2415:2016

![Flood Analysis Screenshot](docs/screenshots/flood-analysis.png)

---

### 🏗️ Channel Analysis Module
Hydraulic capacity calculations for open channels:
- **Manning's Equation** - Velocity & discharge computation
- **Geometric Analysis** - Trapezoidal, rectangular, circular sections
- **Flow Regime Classification** - Froude number analysis
- **Freeboard Safety Check** - Overflow prevention
- **Cross-Section Visualizer** - Real-time geometry preview

**Compliance**: SNI 03-3424-1994

![Channel Analysis Screenshot](docs/screenshots/channel-analysis.png)

---

### ⚖️ Water Balance Module
Supply vs. demand analysis for water resources planning:
- **Monthly Balance Calculation** - 12-month analysis
- **Dependable Flow (Q80)** - Reliable water availability
- **Domestic Demand** - Population-based requirements
- **Irrigation Demand** - Agricultural water needs
- **Environmental Flow** - Ecological sustainability (10% rule)
- **Critical Month Identification** - Deficit period analysis

**Compliance**: SNI 19-6728.1-2002, SNI 6738:2015

![Water Balance Screenshot](docs/screenshots/water-balance.png)

---

### 🤖 AI Consultant
Gemini-powered virtual assistant for hydrological expertise:
- Context-aware analysis of calculation results
- SNI compliance verification
- Design recommendations
- Natural language Q&A
- Report generation assistance

![AI Consultant Screenshot](docs/screenshots/ai-consultant.png)

---

### 🗺️ Interactive Mapping
Spatial visualization of all project data:
- **Leaflet Integration** - Interactive maps with OpenStreetMap
- **Color-Coded Markers** - Blue (Channel), Red (Flood), Green (Water Balance)
- **Click-to-Focus** - Smooth flyTo animation
- **Popup Details** - Project metadata on hover
- **List/Map Toggle** - Flexible data viewing

![Map View Screenshot](docs/screenshots/map-view.png)

---

### 📊 Additional Features

- 📁 **Project History** - Persistent storage with Supabase
- 📤 **Data Export** - CSV/JSON download capabilities
- 📱 **Mobile Responsive** - Touch-optimized UI
- 🌐 **Offline Support** - Service Worker caching (PWA)
- 🎨 **Modern UI** - Tailwind CSS with custom design system
- ♿ **Accessible** - WCAG 2.1 AA compliant

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7.3** - Build tool & dev server
- **Tailwind CSS 3.4** - Utility-first styling
- **Lucide React** - Icon library

### Data Visualization
- **Recharts 2.10** - Chart library
- **Leaflet 1.9** - Interactive maps

### Backend & Database
- **Supabase** - PostgreSQL database & authentication
- **Zod 3.23** - Schema validation

### AI Integration
- **Google Gemini API** - Generative AI for consultant feature

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rekasda-pro.git
   cd rekasda-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Supabase (Required for data persistence)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

   # Google Gemini AI (Optional - for AI Consultant)
   VITE_API_KEY=your-gemini-api-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

Output will be in the `dist/` folder.

---

## 📁 Project Structure

```
rekasda-pro/
├── public/                 # Static assets
│   ├── favicon.svg
│   └── docs/              # CSV data files
├── src/
│   ├── features/          # Feature-based modules
│   │   ├── channel-analysis/    # Manning calculations
│   │   ├── flood-analysis/      # Rational & Nakayasu
│   │   ├── water-balance/       # Supply vs demand
│   │   ├── history/             # Data management
│   │   └── ai-consultant/       # Gemini integration
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Buttons, inputs, modals
│   │   └── common/       # Shared logic components
│   ├── lib/              # Core libraries
│   │   ├── engine/       # Calculation engines
│   │   ├── utils/        # Helper functions
│   │   ├── constants/    # App constants
│   │   └── ai/           # AI configuration
│   ├── services/         # API & business logic
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   ├── data/             # Pilot/sample data
│   ├── App.tsx           # Root component
│   └── index.tsx         # Entry point
├── docs/                 # Documentation
│   ├── guides/           # User guides
│   ├── technical/        # Technical docs
│   ├── standards/        # SNI compliance
│   └── deployment/       # Deployment guides
├── database/             # SQL schemas
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind config
└── vite.config.ts        # Vite config
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Quick Start Guide](docs/guides/QUICK_START.md)** - Get up and running in 5 minutes
- **[System Architecture](docs/technical/SYSTEM_ARCHITECTURE.md)** - Technical deep dive
- **[SNI Compliance](docs/standards/SNI_COMPLIANCE.md)** - Standards reference
- **[Deployment Guide](docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[Troubleshooting](docs/guides/TROUBLESHOOTING.md)** - Common issues

---

## 🧪 Testing

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Manual Testing
The application has been extensively field-tested by water resources engineers.

---

## 🗺️ Roadmap

### Version 1.1 (Q1 2025)
- [ ] PDF report generation
- [ ] Excel export with formulas
- [ ] Multi-user collaboration
- [ ] Project templates library

### Version 1.2 (Q2 2025)
- [ ] Real-time sensor data integration
- [ ] Advanced GIS features (shapefiles)
- [ ] Mobile native apps (React Native)
- [ ] Offline-first PWA

### Version 2.0 (Q3 2025)
- [ ] Multi-language support (English/Indonesian)
- [ ] Advanced statistical analysis
- [ ] Machine learning predictions
- [ ] Government agency integration

See [ROADMAP.md](docs/ROADMAP.md) for detailed plans.

---

## 🤝 Contributing

We welcome contributions from the water resources engineering community!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure SNI compliance for calculation changes

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- React: MIT License
- Leaflet: BSD 2-Clause License
- Supabase: Apache 2.0 License
- Tailwind CSS: MIT License

---

## 👥 Authors & Acknowledgments

### Development Team
- **Lead Developer** - [Your Name](https://github.com/yourusername)
- **Hydrological Consultant** - [Consultant Name]
- **UI/UX Designer** - [Designer Name]

### Special Thanks
- **Badan Standardisasi Nasional (BSN)** - For SNI standards
- **Kementerian PUPR** - For technical guidance
- **Indonesian Water Resources Engineers** - For field testing and feedback
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Support & Contact

### Get Help
- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/rekasda-pro/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/rekasda-pro/discussions)

### Professional Support
- 📧 **Email**: support@rekasda.pro
- 🌐 **Website**: [www.rekasda.pro](https://www.rekasda.pro)
- 💼 **LinkedIn**: [RekaSDA Pro](https://linkedin.com/company/rekasda)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/rekasda-pro&type=Date)](https://star-history.com/#yourusername/rekasda-pro&Date)

---

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/rekasda-pro?style=flat-square)
![GitHub code size](https://img.shields.io/github/languages/code-size/yourusername/rekasda-pro?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/rekasda-pro?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/yourusername/rekasda-pro?style=flat-square)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/rekasda-pro?style=flat-square)

---

<div align="center">

**Built with ❤️ for Indonesian Water Resources Engineers**

[⬆ Back to Top](#-rekasda-pro)

</div>

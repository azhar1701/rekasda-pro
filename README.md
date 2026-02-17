<div align="center">
<img width="1200" height="475" alt="REKASDA Pro Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# REKASDA Pro

**Aplikasi Analisis Hidrologi & Banjir Rencana (SNI Compliant)**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

*Professional water resources analysis tool compliant with Indonesian National Standards (SNI 2415:2016, SNI 6738:2015, SNI 19-6728.1-2002)*

[Quick Start](#quick-start) • [Documentation](docs/) • [Features](#features) • [Tech Stack](#tech-stack)

</div>

---

## 📋 Overview

REKASDA Pro is a comprehensive hydrological analysis application designed for Indonesian water resources engineers. It provides production-grade tools for:

- **Flood Discharge Analysis** (Rational & Nakayasu HSS methods)
- **Water Balance Calculations** (Supply vs. Demand analysis)
- **Manning Channel Capacity** (Open channel hydraulics)
- **AI-Powered Insights** (Gemini integration for recommendations)

All calculations strictly follow **SNI 2415:2016** (Flood Design), **SNI 6738:2015** (Dependable Flow), and **SNI 19-6728.1-2002** (Water Balance) standards.

---

## ✨ Features

### 🌊 Hydrological Analysis
- **Rational Method** - For watersheds < 5000 Ha
- **Nakayasu HSS** - For larger watersheds with hourly rainfall data
- **Frequency Analysis** - Log Pearson III & Gumbel distributions
- **Return Period Calculations** - Q2, Q5, Q10, Q25, Q50, Q100

### 💧 Water Balance Module
- Monthly supply vs. demand analysis
- Dependable flow calculations (Q80)
- Domestic & agricultural water requirements
- Surplus/deficit identification

### 🏗️ Channel Design
- Manning's equation solver
- Trapezoidal & rectangular channels
- Velocity & capacity verification
- Slope optimization

### 🤖 AI Consultant
- Gemini-powered analysis
- Context-aware recommendations
- SNI compliance verification
- Report generation

### 📊 Data Management
- Supabase integration
- Pilot data library
- Calculation history
- Export to PDF/CSV

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Supabase account** (optional, for data persistence)

### Installation

**Option 1: Automated Setup (Recommended)**
```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh && ./start.sh
```

**Option 2: Manual Setup**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/rekasda-pro.git
cd rekasda-pro

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Gemini AI (Required for AI Consultant)
VITE_API_KEY=your_gemini_api_key_here

# Supabase (Optional - for data persistence)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Note:** The app works offline without Supabase. Database features will be disabled.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18.3, TypeScript 5.9 |
| **Styling** | Tailwind CSS 3.4, Lucide Icons |
| **Charts** | Recharts 2.10 |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Google Gemini API |
| **Maps** | Leaflet 1.9 |
| **Build** | Vite 7.3 |
| **Validation** | Zod 4.3 |

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### 📖 Guides
- [**Quick Start Guide**](docs/guides/QUICK_START.md) - Get up and running in 5 minutes
- [**Developer Reference**](docs/guides/DEVELOPER_QUICK_REFERENCE.md) - API and component docs
- [**Troubleshooting**](docs/guides/TROUBLESHOOTING.md) - Common issues and solutions

### 🏗️ Technical Documentation
- [**Architecture**](docs/technical/ARCHITECTURE.md) - System design and folder structure
- [**Component Library**](docs/technical/COMPONENT_LIBRARY.md) - Reusable UI components
- [**Design System**](docs/technical/DESIGN_SYSTEM.md) - Colors, typography, spacing

### 📏 Standards & Compliance
- [**SNI Compliance**](docs/standards/SNI_COMPLIANCE.md) - Indonesian National Standards reference
- [**Calculation Methods**](docs/standards/CALCULATION_METHODS.md) - Hydrological formulas

### 🚀 Deployment
- [**Deployment Guide**](docs/deployment/DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [**Database Setup**](docs/deployment/DATABASE_SETUP.md) - Supabase configuration

---

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint
```

### Project Structure

```
rekasda-pro/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── forms/          # Form components
│   └── results/        # Result display components
├── services/           # API and business logic
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── data/               # Pilot data and constants
├── database/           # SQL schemas and migrations
└── docs/               # Documentation
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **SNI Standards** - Badan Standardisasi Nasional (BSN)
- **Kementerian PUPR** - Indonesian Ministry of Public Works
- **Google Gemini** - AI-powered analysis
- **Supabase** - Backend infrastructure

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/rekasda-pro/issues)
- **Email**: support@rekasda.pro

---

<div align="center">

**Built with ❤️ for Indonesian Water Resources Engineers**

[⬆ Back to Top](#rekasda-pro)

</div>

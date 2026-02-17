# Contributing to REKASDA Pro

Thank you for your interest in contributing to REKASDA Pro! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/rekasda-pro/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features
1. Check [ROADMAP.md](ROADMAP.md) for planned features
2. Open an issue with the `enhancement` label
3. Describe the feature and its benefits
4. Provide use cases and examples

### Code Contributions

#### Setup
```bash
git clone https://github.com/yourusername/rekasda-pro.git
cd rekasda-pro
npm install
npm run dev
```

#### Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm run typecheck`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

#### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Documentation
- Update relevant docs in `docs/` folder
- Keep README.md in sync with changes
- Add JSDoc comments for new functions
- Update CHANGELOG.md

## 📋 Code Standards

### TypeScript
- Use strict mode
- Define proper types (no `any`)
- Export interfaces for public APIs

### React
- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic to custom hooks

### Styling
- Use Tailwind CSS utility classes
- Follow existing color palette
- Ensure responsive design (mobile-first)

### SNI Compliance
- Verify calculations against standards
- Add references to SNI documents
- Include compliance badges where applicable

## ✅ Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript compiles without errors
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Mobile responsive
- [ ] Accessibility checked (keyboard navigation, screen readers)

## 🔍 Review Process

1. Automated checks run (TypeScript, linting)
2. Maintainer reviews code
3. Feedback provided (if needed)
4. Approved and merged

## 📞 Questions?

- Open a [Discussion](https://github.com/yourusername/rekasda-pro/discussions)
- Email: contribute@rekasda.pro

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making REKASDA Pro better!** 🙏

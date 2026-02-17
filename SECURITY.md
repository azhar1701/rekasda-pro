# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: security@rekasda.pro
2. **Subject**: `[SECURITY] Brief description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Every 7 days until resolved
- **Resolution**: Coordinated disclosure after fix

### Security Best Practices

#### For Users
- Keep dependencies updated: `npm update`
- Use environment variables for API keys
- Never commit `.env.local` to version control
- Enable HTTPS in production
- Regularly backup database

#### For Developers
- Validate all user inputs
- Sanitize data before database queries
- Use parameterized queries (prevent SQL injection)
- Implement rate limiting for APIs
- Follow OWASP Top 10 guidelines

## Known Security Considerations

### API Keys
- Gemini API keys are client-side (required for browser usage)
- Supabase uses Row Level Security (RLS)
- Never expose admin keys in frontend

### Data Privacy
- User data stored in Supabase (see their [security](https://supabase.com/security))
- No personal data collected without consent
- Calculation data is user-owned

### Dependencies
- Automated security updates via Dependabot
- Regular audits: `npm audit`
- Critical vulnerabilities patched immediately

## Disclosure Policy

- Security fixes released as patch versions
- CVE assigned for critical vulnerabilities
- Public disclosure after 90 days or fix deployment
- Credit given to reporters (unless anonymous)

---

**Last Updated**: 2024

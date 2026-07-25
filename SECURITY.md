# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within Brothers Mobile Shop ERP, please send an email to [your-security-email@example.com]. All security vulnerabilities will be addressed promptly.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment (what an attacker could achieve)

### Response Timeline

- **Acknowledgment**: Within 48 hours of report
- **Initial assessment**: Within 1 week
- **Fix development**: Depends on severity (critical: 48h, high: 1 week, medium: 2 weeks)
- **Public disclosure**: After fix is released

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, or disruption to our services
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report vulnerabilities promptly and do not publicly disclose until a fix is available

We will not pursue legal action against researchers who follow these guidelines.

## Security Features

### Authentication

- **JWT tokens** with short expiration (15 minutes for access tokens)
- **httpOnly cookies** for refresh token storage (not accessible via JavaScript)
- **Token rotation** on every refresh (old refresh token is invalidated)
- **OTP verification** for sensitive operations (email-based)
- **Password hashing** using bcrypt with salt rounds
- **Brute force protection** — 5 failed attempts per 15 minutes per user+IP
- **Inactivity auto-logout** after 3 hours of no user activity

### Authorization

- **Role-Based Access Control (RBAC)** with granular permissions
- **Ownership checks** — users can only modify their own data (except admins)
- **Middleware guards** — `authenticate` + `authorize` + `requirePermission`
- **Route protection** — both API endpoints and frontend routes

### Input Validation

- **Zod schemas** for all API request bodies
- **NoSQL injection prevention** — regex escaping on all user inputs
- **File upload validation** — MIME type + magic number verification
- **Parameterized queries** via Mongoose (no raw MongoDB queries)

### HTTP Security

- **Helmet.js** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **CORS** — explicit origin whitelist (no wildcard in production)
- **Rate limiting** — configurable per endpoint
- **Null origin rejection** — blocks requests with no Origin header in production

### Data Protection

- **Password policy** — minimum 8 characters, uppercase, lowercase, number
- **Sensitive data exclusion** — passwords never returned in API responses
- **Backup validation** — collection whitelist + 50MB size limit on restore
- **Environment variables** — secrets stored in `.env` (gitignored)
- **Error sanitization** — generic error messages in production

### Audit & Monitoring

- **Audit logging** — all significant actions logged with user, IP, timestamp
- **Security events** — brute force, failed logins, unauthorized access attempts
- **Activity logs** — track who did what and when

## Known Security Considerations

### Accepted Risks

- `xlsx` package has 1 known high vulnerability (no fix available) — used for Excel import/export
- `esbuild` has 1 moderate vulnerability — requires breaking change to fix
- These are documented and accepted as calculated risks

### Areas for Improvement

- Move file uploads to external storage (S3, Cloudinary)
- Add CSRF protection for cookie-based auth
- Implement Content Security Policy reporting
- Add API key authentication for external integrations
- Enable MongoDB field-level encryption for sensitive data

## Security Best Practices for Deployment

### Environment

```bash
# Use strong, unique secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Never use default passwords in production
SEED_PASSWORD_ADMIN=<strong-random-password>

# Restrict CORS to your domain
CLIENT_URL=https://your-domain.com

# Use HTTPS in production
# Configure reverse proxy (nginx) with SSL termination
```

### MongoDB

- Enable authentication
- Use dedicated database user with minimal permissions
- Enable TLS for connections
- Restrict network access (firewall rules)
- Regular backups with encryption

### Docker

- Never run containers as root
- Use multi-stage builds to reduce attack surface
- Scan images for vulnerabilities (`docker scan`)
- Use specific image tags (not `latest`)
- Mount volumes as read-only where possible

### Network

- Use HTTPS everywhere (Let's Encrypt for free certificates)
- Enable HSTS headers
- Configure firewall rules
- Use a WAF (Web Application Firewall) in production
- Monitor for unusual traffic patterns

## Dependency Management

### Regular Audits

```bash
# Check for vulnerabilities
cd client && npm audit
cd server && npm audit

# Fix automatically when possible
npm audit fix

# Review and manually fix remaining issues
npm audit
```

### Update Strategy

- **Critical vulnerabilities**: Patch within 48 hours
- **High vulnerabilities**: Patch within 1 week
- **Medium vulnerabilities**: Patch within 2 weeks
- **Low vulnerabilities**: Patch in next release

### Monitoring

- Subscribe to security advisories for dependencies
- Use `npm audit` in CI/CD pipeline
- Consider using Snyk or Dependabot for automated scanning

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Active exploitation, data breach | Immediate |
| High | Vulnerable but not yet exploited | 24 hours |
| Medium | Requires specific conditions to exploit | 1 week |
| Low | Minor issue, limited impact | Next release |

### Response Steps

1. **Identify** — Confirm the vulnerability and scope
2. **Contain** — Limit damage (revoke credentials, block IPs)
3. **Eradicate** — Fix the vulnerability
4. **Recover** — Restore normal operations
5. **Learn** — Post-incident review, update procedures

## Contact

- **Security issues**: [your-security-email@example.com]
- **General issues**: [GitHub Issues](https://github.com/your-username/mobile-shop-erp/issues)

## Acknowledgments

We appreciate the security research community and responsible disclosure of vulnerabilities.

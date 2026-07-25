# Contributing to Brothers Mobile Shop ERP

Thank you for considering contributing to Brothers Mobile Shop ERP! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** — descriptive summary of the issue
- **Steps to reproduce** — numbered steps to reproduce the behavior
- **Expected behavior** — what you expected to happen
- **Actual behavior** — what actually happened
- **Screenshots** — if applicable
- **Environment** — OS, browser, Node.js version, npm version

### Suggesting Features

Feature suggestions are welcome. Please include:

- **Use case** — why this feature would be useful
- **Proposed behavior** — how you envision it working
- **Alternatives considered** — other solutions you thought about

### Contributing Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20)
- MongoDB 6+ (local or Docker)
- Git

### Setup Steps

```bash
# Fork and clone
git clone https://github.com/your-username/mobile-shop-erp.git
cd mobile-shop-erp

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Set up environment
cd ../server
cp .env.example .env
# Edit .env with your configuration

# Seed database
npm run seed

# Start development
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

## Project Structure

### Backend (`server/`)

Each feature follows this module pattern:

```
modules/<feature>/
├── <feature>.routes.js    # Route definitions
├── <feature>.controller.js # Request handlers
├── <feature>.service.js   # Business logic
├── <feature>.validator.js # Zod validation schemas
└── <feature>.model.js     # Mongoose schema
```

### Frontend (`client/`)

```
src/
├── components/            # Reusable components
│   ├── layout/           # Layout components (Sidebar, Topbar)
│   └── ui/               # UI components (ThemeToggle, etc.)
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API client
├── pages/                # Page components (route-based)
└── utils/                # Helper utilities
```

## Coding Standards

### General

- Use **ES modules** (`import/export`) everywhere
- No `var` — use `const` or `let`
- Use meaningful variable and function names
- Keep functions small and focused

### JavaScript/JSX

- **React**: Functional components only, hooks for state
- **Props**: Destructure in function parameters
- **Hooks**: Follow Rules of Hooks (no conditional calls)
- **State**: Use Context for global state, TanStack Query for server state

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Avoid inline styles except for dynamic values
- Follow the existing design mode pattern for theme support
- Use the `neu-*` class convention for design mode styles

### Backend

- **Routes**: RESTful naming conventions
- **Controllers**: Handle request/response, delegate to services
- **Services**: Business logic only, no HTTP concerns
- **Validators**: Zod schemas for all request bodies
- **Models**: Mongoose schemas with proper validation

### API Responses

Use the standard response format:

```javascript
// Success
res.status(200).json({
  success: true,
  message: 'Operation successful',
  data: result,
  pagination: { page, limit, total, totalPages } // if applicable
});

// Error
res.status(400).json({
  success: false,
  message: 'Error description'
});
```

### Error Handling

- Use `ApiError` class for operational errors
- Never expose internal errors to the client in production
- Log errors server-side for debugging

## Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without functionality changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI configuration changes

### Examples

```
feat(sales): add invoice PDF export
fix(auth): prevent token refresh race condition
docs(readme): update installation instructions
refactor(imei): extract validation logic to service
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if you changed APIs or added features
2. **Test your changes** — ensure the app works end-to-end
3. **Run linting** — `npm run lint` in both client and server
4. **Build successfully** — `npm run build` in client
5. **One feature per PR** — keep pull requests focused

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All existing features still work
- [ ] No console errors

## Screenshots (if applicable)
```

### Review Process

1. All PRs require at least one review
2. Address review feedback promptly
3. Squash commits before merging if needed
4. Delete feature branch after merge

## Project Conventions

### File Naming

- **Components**: PascalCase (`UserList.jsx`)
- **Utilities**: camelCase (`formatCurrency.js`)
- **Models**: PascalCase (`User.model.js`)
- **Routes/Services/Controllers**: camelCase with feature prefix

### Imports

Order imports in this sequence:

1. External packages (`react`, `react-router-dom`, etc.)
2. Internal components (`../components/...`)
3. Internal utilities (`../lib/...`, `../hooks/...`)
4. Internal context (`../context/...`)
5. Styles (if any)

### Environment Variables

- **Server**: Only access via `process.env.VARIABLE_NAME`
- **Client**: Only access via `import.meta.env.VITE_VARIABLE_NAME`
- Never commit `.env` files
- Use `.env.example` as a template

## License

By contributing, you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE).

## Questions?

Feel free to open an issue for any questions about contributing.

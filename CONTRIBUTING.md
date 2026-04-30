# Contributing to OneLink

Thank you for your interest in contributing to OneLink! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)
- Basic knowledge of JavaScript, Node.js, Express, and MongoDB

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/one-link.git
cd one-link
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/one-link.git
```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your local settings:
```env
MONGODB_URI=mongodb://localhost:27017/onelink_dev
JWT_LOGIN_SECRET=dev-secret-change-in-production
SESSION_SECRET=dev-session-secret
NODE_ENV=development
PORT=3000
```

### 3. Start Development Server

```bash
npm start
```

Or with nodemon for auto-restart:
```bash
npm install -g nodemon
nodemon app.js
```

### 4. Access Application

Open http://localhost:3000 in your browser

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Collect information about the bug
3. Include steps to reproduce

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox]
- Node.js version: [e.g., 18.0.0]
- MongoDB version: [e.g., 5.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Features

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or screenshots.
```

### Contributing Code

1. **Find an issue** to work on or create a new one
2. **Comment** on the issue to let others know you're working on it
3. **Create a branch** for your work:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Commit your changes** following commit guidelines
7. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

8. **Create a Pull Request** on GitHub

## Coding Standards

### JavaScript Style Guide

We follow standard JavaScript conventions:

#### General Rules

```javascript
// Use const for variables that won't be reassigned
const userName = 'John';

// Use let for variables that will be reassigned
let counter = 0;

// Use meaningful variable names
const userProfile = await Profile.findOne({ userid });

// Use camelCase for variables and functions
const getUserData = async (userId) => {
    // function body
};

// Use PascalCase for classes and models
class UserController {
    // class body
}
```

#### Async/Await

Prefer async/await over callbacks:

```javascript
// Good
const user = await User.findById(userId);

// Avoid
User.findById(userId, (err, user) => {
    // callback
});
```

#### Error Handling

Always handle errors properly:

```javascript
try {
    const result = await someAsyncOperation();
    return result;
} catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw new AppError('Operation failed', 500);
}
```

#### Comments

Use JSDoc for functions:

```javascript
/**
 * @route POST /api/users
 * @description Create a new user
 * @access Public
 * @param {Object} req.body - User data
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {Object} Created user object
 * @throws {AppError} 400 if validation fails
 */
router.post('/users', async (req, res) => {
    // implementation
});
```

### File Organization

```
one-link/
├── config/          # Configuration files
├── middlewares/     # Express middlewares
├── models/          # Mongoose models
├── routes/          # Express routes
├── utils/           # Utility functions
├── views/           # EJS templates
├── public/          # Static files
└── app.js           # Main application file
```

### Naming Conventions

- **Files**: lowercase with hyphens (e.g., `user-controller.js`)
- **Routes**: lowercase with hyphens (e.g., `/api/user-profile`)
- **Variables**: camelCase (e.g., `userName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Classes**: PascalCase (e.g., `UserController`)
- **Database Models**: PascalCase (e.g., `User`, `Profile`)

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(auth): add Google OAuth login

- Implement Google OAuth 2.0 strategy
- Add login button to auth pages
- Update user model to support googleId

Closes #123

fix(dashboard): resolve pagination bug

The pagination was showing incorrect page numbers
when filtering links. Fixed by updating the query logic.

Fixes #456

docs(readme): update installation instructions

Added detailed steps for MongoDB setup and
environment configuration.
```

### Commit Best Practices

- Write clear, concise commit messages
- Use present tense ("add feature" not "added feature")
- Keep commits focused on a single change
- Reference issues in commit messages
- Commit often with logical chunks

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Test your changes** thoroughly
3. **Update documentation** if needed
4. **Run linter** (if configured):
```bash
npm run lint
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## Testing

### Manual Testing

Test your changes thoroughly:

1. **Functionality**: Does it work as expected?
2. **Edge cases**: Test boundary conditions
3. **Error handling**: Test error scenarios
4. **UI/UX**: Check visual appearance and usability
5. **Cross-browser**: Test in different browsers
6. **Responsive**: Test on different screen sizes

### Test Checklist

- [ ] Feature works as intended
- [ ] No console errors
- [ ] No breaking changes to existing features
- [ ] Responsive design maintained
- [ ] Accessibility considerations
- [ ] Performance impact minimal

## Documentation

### Code Documentation

- Add JSDoc comments to functions
- Explain complex logic with inline comments
- Update README.md if needed
- Update API documentation

### User Documentation

- Update user guides for new features
- Add screenshots/GIFs for UI changes
- Update FAQ if applicable

## Project Structure

```
one-link/
├── app.js                 # Main application entry
├── package.json           # Dependencies
├── .env.example          # Environment template
├── README.md             # Project overview
├── CONTRIBUTING.md       # This file
├── DEPLOYMENT.md         # Deployment guide
├── config/
│   └── passport.js       # Passport configuration
├── middlewares/
│   ├── auth.js          # Authentication middleware
│   ├── errorHandler.js  # Error handling
│   └── security.js      # Security middleware
├── models/
│   ├── user.js          # User model
│   ├── profile.js       # Profile model
│   ├── link.js          # Link model
│   └── linkClick.js     # Analytics model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── dashboard.js     # Dashboard routes
│   ├── profile.js       # Profile routes
│   ├── appearance.js    # Appearance routes
│   └── analytics.js     # Analytics routes
├── utils/
│   ├── logger.js        # Winston logger
│   ├── cache.js         # Redis cache
│   └── emailController.js # Email service
├── views/
│   ├── auth/            # Auth templates
│   ├── dashboard/       # Dashboard templates
│   └── userpage/        # Public profile templates
└── public/
    ├── css/             # Stylesheets
    ├── js/              # Client scripts
    └── images/          # Static images
```

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For private inquiries

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in project documentation

## License

By contributing to OneLink, you agree that your contributions will be licensed under the project's license.

## Questions?

Feel free to reach out if you have any questions about contributing!

---

Thank you for contributing to OneLink! 🎉
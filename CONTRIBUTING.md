# Contributing to MyCoin

We love your input! We want to make contributing to MyCoin as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/mycoin.git
   cd mycoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test both success and error cases

### Commit Messages

Use clear and meaningful commit messages:

```
feat: add new wallet encryption feature
fix: resolve transaction validation bug
docs: update API documentation
test: add tests for blockchain validation
refactor: improve P2P network code
```

### Issues

We use GitHub issues to track public bugs. Report a bug by opening a new issue.

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Explain the use case
3. Describe the proposed solution
4. Consider the impact on existing users

### Security Issues

Please do not report security vulnerabilities through public GitHub issues. Instead, send an email to security@mycoin.dev.

### License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

## Getting Help

- Check the documentation in the `docs/` folder
- Look through existing issues
- Join our discussions on GitHub
- Ask questions in pull requests

Thank you for contributing to MyCoin! 🚀

# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The MyCoin team and community take security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### Where to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@mycoin.dev**

If you prefer, you can also use our GPG key to encrypt your report:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[GPG Key would be here in production]
-----END PGP PUBLIC KEY BLOCK-----
```

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Timeline

- **Initial Response**: Within 48 hours
- **Detailed Response**: Within 7 days
- **Fix Timeline**: Varies based on complexity, typically 30-90 days

### What to Expect

After submitting a report, you can expect:

1. **Acknowledgment**: We'll confirm receipt of your vulnerability report
2. **Assessment**: We'll assess the vulnerability and determine its impact
3. **Fix Development**: We'll work on a fix for the vulnerability
4. **Disclosure**: We'll coordinate disclosure of the vulnerability

## Security Measures

### Current Security Features

1. **Cryptographic Security**
   - ECDSA (secp256k1) for digital signatures
   - SHA-256 for hashing
   - RIPEMD-160 for address generation
   - AES-256 for private key encryption

2. **Wallet Security**
   - Private keys never leave the device
   - Encrypted storage with user passphrases
   - Secure key generation using system entropy
   - Mnemonic phrase backup support

3. **Network Security**
   - Proof of Work consensus mechanism
   - Transaction validation and verification
   - Double-spend prevention
   - Input validation and sanitization

4. **Application Security**
   - Electron security best practices
   - Content Security Policy (CSP)
   - Secure IPC communication
   - Input validation on all endpoints

### Known Security Considerations

1. **Educational Purpose**: This software is primarily for educational use
2. **Security Audits**: No formal security audit has been conducted
3. **Production Use**: Not recommended for production cryptocurrency use without additional security review
4. **Key Management**: Users are responsible for securing their private keys and passphrases

### Security Best Practices for Users

1. **Backup Your Wallet**
   - Always backup your mnemonic phrase
   - Store backups in multiple secure locations
   - Never share your private keys or mnemonic phrase

2. **Use Strong Passphrases**
   - Use long, complex passphrases for wallet encryption
   - Consider using a password manager
   - Never reuse passphrases from other services

3. **Keep Software Updated**
   - Always use the latest version of MyCoin
   - Enable automatic updates when available
   - Monitor security announcements

4. **Network Security**
   - Only connect to trusted peers
   - Use secure networks (avoid public WiFi for transactions)
   - Consider using a VPN for additional privacy

5. **Device Security**
   - Keep your operating system updated
   - Use antivirus software
   - Avoid running MyCoin on compromised systems

### Security Roadmap

Future security enhancements planned:

1. **Hardware Wallet Support**
   - Integration with Ledger and Trezor
   - Secure transaction signing
   - Enhanced key protection

2. **Multi-Signature Wallets**
   - Shared wallet control
   - Enhanced security for large amounts
   - Business and institutional use

3. **Formal Security Audit**
   - Third-party security assessment
   - Penetration testing
   - Code review by security experts

4. **Advanced Encryption**
   - Post-quantum cryptography research
   - Enhanced key derivation
   - Secure enclave support

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow a coordinated disclosure model:

1. **Private Disclosure**: Report sent privately to our security team
2. **Assessment**: We assess and validate the vulnerability
3. **Fix Development**: We develop and test a fix
4. **Public Disclosure**: We publicly disclose the vulnerability after a fix is available

### Timeline

- **Day 0**: Vulnerability reported
- **Day 1-7**: Initial assessment and response
- **Day 7-30**: Fix development and testing
- **Day 30-90**: Public disclosure (may be extended for complex issues)

### Recognition

We maintain a security hall of fame to recognize researchers who help improve MyCoin's security:

- Responsible disclosure of valid security vulnerabilities
- Constructive feedback on security improvements
- Contributions to security documentation and best practices

## Contact Information

- **Security Email**: security@mycoin.dev
- **General Contact**: contact@mycoin.dev
- **GitHub Issues**: For non-security related bugs only

## Legal

This security policy is subject to our terms of service and privacy policy. By reporting vulnerabilities, you agree to:

- Not access or modify user data without explicit permission
- Not perform testing that could harm our users or systems
- Not publicly disclose vulnerabilities before we've had a chance to address them
- Follow responsible disclosure practices

Thank you for helping keep MyCoin and our users safe!

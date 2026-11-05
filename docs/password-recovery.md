# Password recovery setup

Password reset uses the existing Prisma `VerificationToken` table. The database stores a SHA-256 hash of a cryptographically random, one-time token with a 30-minute expiry. The raw token is sent only in the reset email; the link keeps it in the URL fragment and the reset page removes it from browser history before submitting it.

Configure these server-side environment variables to deliver reset email:

- `NEXTAUTH_URL`: the canonical origin used to build reset links.
- `RESEND_API_KEY`: a Resend API key with permission to send mail.
- `RESEND_FROM_EMAIL`: a sender address or name/address verified with Resend.

If any delivery setting is missing, reset requests still receive the same generic acknowledgement, but no token is created or link exposed. If delivery fails after token creation, that token is removed. There is no console, response-body, or development-link fallback.

The completion endpoint checks token hash and expiry, conditionally consumes the token and updates the password in one transaction, and invalidates other outstanding reset links for that account. Passwords must contain 12–200 characters and are hashed with bcrypt.

The existing NextAuth configuration uses stateless JWT sessions with a 30-day maximum age. This implementation changes the password and invalidates reset links, but does not revoke JWTs already issued on other devices. That requires a separate session-revocation design.

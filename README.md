# ShieldBot – Platform Security Academy

An e-learning website for a Platform Security midterm project. Front-end only (HTML, CSS, JavaScript). No installation needed.

## Run it
1. Keep every file in the same folder (`index.html`, `style.css`, `courses.js`, `resources.js`, `script.js`, `images/`).
2. Double-click `index.html`. For the best results (and for Google login) serve it locally instead:
   `python -m http.server 8000`, then open http://localhost:8000
3. YouTube videos and external links need an internet connection.

## Features
- Sign up / log in (email or username), plus optional **2FA** (authenticator-app codes)
- 8 courses, 23 topics; each topic has reading material, an image, videos/links and a quiz
- **Pass mark: 75%** to unlock the next topic (change `PASS_PERCENT` in `script.js`)
- Badges per completed course, dashboard, profile, catalog, About, FAQ, Contact, dark mode
- Educator Studio: educators add topics and quiz questions (educator code is in `script.js`, `EDU_CODE`)

## Files
| File | Purpose |
|---|---|
| `index.html` | Page shell + Content Security Policy |
| `style.css` | Styling, themes, accessibility styles |
| `courses.js` | Courses, topics, quiz questions |
| `resources.js` | Images, YouTube IDs, "Learn more" links per topic |
| `script.js` | Login, 2FA, dashboard, quizzes, profile, pages |
| `images/` | SVG diagrams used in lessons |

## Customize
- **Add a video:** in `resources.js`, set `vid:'VIDEO_ID'` (the part after `v=` in a YouTube URL) on a topic.
- **Google login:** the button shows "not available for now". Real Google sign-in needs a Google Client ID and a server to verify tokens.
- **Group member names:** edit the About page text in `script.js`.

## Security design (for your presentation)
- Passwords are salted and hashed with PBKDF2-SHA256 (150,000 iterations) via the Web Crypto API; never stored in plain text.
- Login lockout (3 failures = 30 s), auto-logout after 5 minutes idle, password policy (10+ chars, mixed, not common).
- 2FA uses TOTP (RFC 6238), compatible with Google Authenticator.
- Content Security Policy limits scripts, frames and network access; the code never uses `innerHTML`, so text cannot run as script.
- YouTube is embedded through `youtube-nocookie.com` in a sandboxed iframe; external links use `rel="noopener noreferrer"`.

## Known limitations (be honest with your instructor)
This is a **front-end demonstration**. Accounts, progress, 2FA secrets and quiz answers live in the browser, so a determined user could edit them. Real enforcement needs a backend: server-side password hashing, sessions in HttpOnly cookies, quiz answers scored on the server, and a database. The Google token is also not verified on a server here.

## New in v3
ShieldBot robot logo and mascot; real Google logo; profile icon upload; badge gallery (Profile page) that unlocks automatically; easier 2FA (copy key / tap-to-add, auto-verify, trust device for 30 days); Video library page (paste any YouTube link).

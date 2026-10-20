# ICEMAN CODE LEARN

Mobile-first coding academy frontend with a Node.js/Express backend and server-side Gemini AI.

## Project structure

```text
iceman-code-learn/
├── public/
│   └── index.html
├── src/
│   ├── ai.js
│   └── labs.js
├── server.js
├── package.json
├── render.yaml
├── .env.example
├── .gitignore
└── README.md
```

## Deploy on Render

1. Upload these files to the root of your GitHub repository. `package.json` and `server.js` must be at the repository root.
2. In Render, create or open the **Web Service** connected to that repository.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. In Render → your service → **Environment**, add:
   - `GEMINI_API_KEY` = your private key from Google AI Studio
   - `GEMINI_MODEL` = `gemini-3.5-flash`
   - `NODE_ENV` = `production`
6. Save changes and redeploy. Never put the API key in `public/index.html`, `ai.js` running in a browser, or GitHub.
7. Open these endpoints on your deployed domain:
   - `/api/health` — confirms the web server is running
   - `/api/ai/status` — reports whether the key is present (it never returns the key)
8. Open the website and send a test message in ICEMAN AI Assistant. If it fails, the page now displays a useful error. Also check Render → Logs.

## Common AI errors

- `GEMINI_API_KEY is missing...`: add the environment variable in Render and redeploy.
- `Gemini API authentication/permission error`: check that the key is valid and Gemini API access is enabled.
- `Gemini model or endpoint not found`: check `GEMINI_MODEL` against the models available for your key.
- `Gemini rate limit or quota reached`: check API usage and quota.
- `Gemini took too long...`: retry and check service/API availability.

## Local run

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
```

Edit `.env` and set a real `GEMINI_API_KEY`, then:

```bash
npm start
```

Open `http://localhost:3000`.

## Notes

- The website saves learning progress, projects, snippets, and notes in the browser's local storage; this starter does not sync them between devices.
- The admin/owner controls remain a frontend placeholder and are not a real admin authentication system.
- The HTML/JavaScript preview is intended for learning. Do not run code from untrusted sources.

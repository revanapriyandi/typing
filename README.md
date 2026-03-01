# TypeRush

**TypeRush** is an open-source, beautifully designed online typing speed test application built to help you master your typing skills, compete globally, and race against friends in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🏎️ **Typing Engine**: Live keystroke detection calculating WPM (Words Per Minute) and Accuracy in real-time.
- 🏁 **Tournaments**: Join or host scheduled typing tournaments with automated bracket generation and real-time spectating.
- 🕒 **Multiple Test Modes**: Choose between time limits (15s, 30s, 60s, 120s) or word counts (25, 50, 100).
- 🌍 **Internationalization (i18n)**: Seamless language localization (English & Indonesian) with dynamic metadata for social sharing.
- 🏆 **Global Leaderboard**: Competitive daily, weekly, and all-time leaderboards showcasing the fastest typists around the world.
- 🏅 **Achievement System**: Unlock dynamic badges as you conquer specific milestones (e.g., Century Typer, Perfection).
- 👤 **User Profiles**: Track your personal progress, average WPM, and gallery of unlocked achievements via Firebase Authentication.
- 🤝 **Real-time Multiplayer**: Host or join private rooms and race against friends live via Firebase Realtime Database.
- ⌨️ **Mechanical Sound Effects**: Immersive, toggleable mechanical keyboard sounds.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Database**: [Firebase](https://firebase.google.com/) (Firestore, Realtime Database, Authentication, Hosting)
- **Localization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: Next.js optimized hosting (Vercel/Firebase)

## Getting Started

Follow these steps to set up the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/revanapriyandi/typerush.git
cd typerush
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the app.

## Contributing

We welcome contributions from the community! Whether it's adding a new language dictionary, fixing a bug, or introducing a new feature, your help is appreciated.

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to get started. Don't forget to review our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

TypeRush is open-source software licensed under the [MIT License](LICENSE).

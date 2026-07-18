# Discussly

**Discussly** is a real-time, multiplayer random topic generator and discussion timer designed to spark great conversations. 

![Discussly Logo](./public/logo.svg)

## Features

- **Topic Generator**: Draw from a curated bank of topics across various categories (Philosophy, Technology, Culture, etc.), or use the AI generator to come up with fresh ideas.
- **Custom Topic Library**: Add your own custom topics, tag them, and assign a "spiciness" level (🌶️).
- **Multiplayer Presence**: Built with Liveblocks, Discussly allows you to see who else is in the room with live cursors and a real-time "online" counter.
- **Discussion Timer**: Keep your conversations on track with a shared countdown timer that syncs across all participants.
- **Dark Mode**: Beautiful UI supporting both light and dark modes.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **State & Collaboration**: Liveblocks (Presence & Storage), Zustand
- **Database**: Prisma with SQLite
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Setup environment variables:**
   Create a `.env` file and configure your Liveblocks keys (and any AI API keys used for generation):
   ```env
   LIVEBLOCKS_SECRET_KEY=your_secret_key
   ```

3. **Run the development server:**
   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License
MIT

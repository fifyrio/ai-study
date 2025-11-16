# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered flashcard generator application built with Next.js 16, React 19, and TypeScript. The app generates 10 study flashcards from user-provided learning materials using AI, with support for text-to-speech functionality.

## Development Commands

```bash
# Development
pnpm dev                 # Start development server (http://localhost:3000)
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint

# Package manager
# This project uses pnpm (see pnpm-lock.yaml)
```

## Environment Variables

Required environment variables (create `.env.local`):

```
OPENROUTER_API_KEY=your_key_here        # For flashcard generation (OpenRouter API)
OPENAI_API_KEY=your_key_here            # For text-to-speech (OpenAI TTS API)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Optional, for API referrer
```

## Architecture

### Next.js Configuration

- **TypeScript**: Strict mode enabled, build errors ignored (`ignoreBuildErrors: true`)
- **Images**: Unoptimized (`unoptimized: true`)
- **Path Aliases**: `@/*` maps to root directory

### UI Framework

Built with shadcn/ui ("new-york" style) + Radix UI primitives:
- Configuration in `components.json`
- Reusable components in `components/ui/`
- Uses Tailwind CSS v4 with CSS variables for theming
- Icon library: `lucide-react`

### Application Flow

1. **Main Page** (`app/page.tsx`): Landing page with gradient background and `FlashcardGenerator` component
2. **Flashcard Generator** (`components/flashcard-generator.tsx`):
   - Client component with state management for content, flashcards, loading, errors
   - Language selection (中文/英语)
   - Calls `/api/generate-flashcards` endpoint
   - Renders `FlashcardGrid` when flashcards are generated
3. **Flashcard Grid** (`components/flashcard-grid.tsx`):
   - Displays 10 flashcards in 2-column grid
   - Click card to view answer in modal overlay
   - Audio playback button calls `/api/text-to-speech`
4. **API Routes**:
   - `/api/generate-flashcards/route.ts`: Uses OpenRouter (openai/gpt-5-mini model) to generate exactly 10 Q&A pairs from learning materials
   - `/api/text-to-speech/route.ts`: Uses OpenAI TTS API (tts-1 model, alloy voice) to convert text to speech

### Key Dependencies

- **AI/API**: `ai` package (v5.0.87), OpenRouter, OpenAI
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **UI Components**: Full Radix UI suite (@radix-ui/react-*)
- **Styling**: `tailwindcss` v4, `tailwind-merge`, `class-variance-authority`
- **Icons**: `lucide-react`
- **Toast**: `sonner`
- **Analytics**: `@vercel/analytics`

### Styling Utilities

- `lib/utils.ts`: Exports `cn()` function for merging Tailwind classes with clsx + tailwind-merge

### Component Patterns

- Client components use `"use client"` directive
- Consistent error handling with user-friendly Chinese error messages
- Loading states with spinner animations
- Gradient backgrounds and modern glassmorphism effects
- Responsive design with mobile-first approach

## Important Notes

- Application is primarily in Chinese (UI, error messages, AI prompts)
- Flashcard generation always produces exactly 10 cards
- AI responses are parsed as JSON after cleaning markdown code fences
- Text-to-speech returns audio/mpeg binary data
- TypeScript build errors are ignored in Next.js config (consider fixing before production)

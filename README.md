# Rostriq - Next.js + Supabase + shadcn/ui Starter

A modern, full-stack web application starter built with Next.js 14, Supabase, and shadcn/ui components.

## Features

- ⚡ **Next.js 14** - Latest features with App Router
- 🎨 **shadcn/ui** - Beautiful, accessible UI components
- 🔐 **Supabase** - Backend as a service with authentication
- 🎯 **TypeScript** - Full type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📱 **Responsive Design** - Mobile-first approach
- 🔒 **Authentication** - Built-in sign up/sign in functionality
- 🐳 **Local Development** - Full local Supabase environment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker and Docker Compose
- Supabase CLI

### Option 1: Local Supabase Development (Recommended)

This project includes a complete local Supabase environment, perfect for development without external dependencies.

#### 1. Install Supabase CLI

```bash
npm install -g supabase
```

#### 2. Start Local Supabase

```bash
# Start Supabase services
supabase start

# Start your Next.js app (in another terminal)
npm run dev
```

#### 3. Access Local Services

Once started, the following services will be available:

- **🌐 Supabase API Gateway**: http://localhost:54331
- **🎨 Supabase Studio**: http://localhost:54333
- **🐘 PostgreSQL Database**: localhost:54332
- **📧 Email Testing**: http://localhost:54334

#### 4. Environment Configuration

The project automatically uses the local Supabase configuration. When you run `supabase start`, it creates a `.env.local` file with the correct local URLs and keys.

#### 5. Local Supabase Management

```bash
# Show service status
supabase status

# View logs
supabase logs
supabase logs postgres

# Stop services
supabase stop

# Reset everything (removes all data)
supabase reset
```

### Option 2: Cloud Supabase

If you prefer to use a cloud Supabase instance:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from the project settings
3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies and Start Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── auth-form.tsx   # Authentication form
├── lib/                # Utility functions
│   ├── supabase.ts     # Supabase client configuration
│   └── supabase-server.ts # Server-side Supabase
├── types/              # TypeScript type definitions
└── supabase/           # Local Supabase configuration
    └── config.toml     # Supabase configuration
```

## Local Supabase Architecture

The local Supabase environment includes:

- **PostgreSQL 15** - Main database
- **PostgREST** - REST API for database
- **GoTrue** - Authentication service
- **Realtime** - Real-time subscriptions
- **Storage** - File storage service
- **Edge Runtime** - Edge functions
- **Kong** - API gateway and routing
- **Supabase Studio** - Web-based database management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Adding shadcn/ui Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add <component-name>
```

## Supabase Integration

The project includes:

- **Client-side Supabase client** for browser usage
- **Server-side Supabase client** for API routes and server components
- **Authentication helpers** for sign up/sign in
- **Cookie-based session management**
- **Local development environment** with Docker

## Customization

### Styling

- Modify `src/app/globals.css` for global styles
- Use Tailwind CSS classes for component styling
- Customize shadcn/ui theme in `src/app/globals.css`

### Components

- Add new components in `src/components/`
- Use shadcn/ui components as building blocks
- Follow the established component patterns

### Local Supabase

- Modify `supabase/config.toml` to adjust service configurations
- Update ports and other settings as needed
- Customize JWT secrets and other environment variables

## Troubleshooting

### Local Supabase Issues

1. **Services not starting**: Check Docker is running and ports are available
2. **Connection errors**: Wait for services to be healthy (use `supabase status`)
3. **Port conflicts**: Modify ports in `supabase/config.toml` if needed
4. **Reset environment**: Use `supabase reset` to start fresh

### Common Issues

- **Missing environment variables**: Ensure `.env.local` exists and is properly configured
- **Build errors**: Check that all dependencies are installed
- **Authentication issues**: Verify Supabase service is running and accessible

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)

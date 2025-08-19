import { Header } from '@/components/header'
import { SignInForm } from '@/components/signin-form'

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back to RostrIQ
            </p>
          </div>
          
          <SignInForm />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-primary hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

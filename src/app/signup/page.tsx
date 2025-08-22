import { MinimalHeader } from '@/components/minimal-header'
import { SignUpForm } from '@/components/signup-form'

export default function SignUpPage() {
  return (
    <>
      <MinimalHeader />
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              Join RostrIQ and start managing your workforce efficiently
            </p>
          </div>
          
          <SignUpForm />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/signin" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

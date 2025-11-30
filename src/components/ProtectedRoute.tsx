import { useAuth } from "@clerk/clerk-react";
import { SignIn } from "@clerk/clerk-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not signed in, show the sign-in page
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SignIn 
          routing="virtual"
          redirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    );
  }

  // If signed in, render the protected content
  return <>{children}</>;
}


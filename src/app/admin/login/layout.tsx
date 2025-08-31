interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  // No admin layout wrapper for login page - just return the children directly
  return <>{children}</>;
}

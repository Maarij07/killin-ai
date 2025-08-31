interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  // Just pass through children - authentication and layout logic is handled at root level
  return <>{children}</>;
}

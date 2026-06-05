import { useEffect } from "react";
import { useLocation } from "wouter";

// Home redirects to Dashboard
export default function Home() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, []);
  return null;
}

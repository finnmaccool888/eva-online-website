"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to mirror page with profile view
    router.replace('/mirror?view=profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-600">Redirecting to profile...</p>
      </div>
    </div>
  );
} 
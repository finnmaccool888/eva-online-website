"use client";

import { useEffect, useState } from "react";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { Button } from "@/components/ui/button";

export default function DebugAuthPage() {
  const { auth, loading } = useTwitterAuth();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [cookies, setCookies] = useState<string>("");
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get all localStorage items
    const lsData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          lsData[key] = value ? JSON.parse(value) : null;
        } catch {
          lsData[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(lsData);

    // Get cookies
    setCookies(document.cookie);

    // Get URL params
    const params = new URLSearchParams(window.location.search);
    const paramsObj: Record<string, string> = {};
    params.forEach((value, key) => {
      paramsObj[key] = value;
    });
    setUrlParams(paramsObj);
  }, []);

  const clearAll = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Hook State</h2>
          <p>Loading: {loading.toString()}</p>
          <p>Auth Present: {(!!auth).toString()}</p>
          {auth && (
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(auth, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">URL Parameters</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(urlParams, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">localStorage</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <pre className="text-sm overflow-auto break-all">
            {cookies}
          </pre>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={() => window.location.href = "/api/auth/twitter"}>
            Start Auth Flow
          </Button>
          <Button onClick={clearAll} variant="destructive">
            Clear All Auth Data
          </Button>
          <Button onClick={() => window.location.href = "/mirror"} variant="outline">
            Go to Mirror
          </Button>
        </div>
      </div>
    </div>
  );
}

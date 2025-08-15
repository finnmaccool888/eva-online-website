'use client';

import { useEffect, useState, useCallback } from 'react';
import { TwitterAuth, setTwitterAuth, getTwitterAuth } from '@/lib/mirror/auth';

export function useTwitterAuth() {
  const [auth, setAuth] = useState<TwitterAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  
  const checkAuth = useCallback(async () => {
    if (checked) return;
    
    console.log('[useTwitterAuth] Checking authentication...');
    
    // First check localStorage
    const localAuth = getTwitterAuth();
    if (localAuth) {
      console.log('[useTwitterAuth] Found auth in localStorage');
      setAuth(localAuth);
      setLoading(false);
      setChecked(true);
      return;
    }
    
    // Check URL parameters (backup method)
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';
    const encodedAuth = urlParams.get('data');
    
    if (authSuccess && encodedAuth) {
      try {
        console.log('[useTwitterAuth] Found auth data in URL');
        const authData = JSON.parse(atob(encodedAuth));
        setTwitterAuth(authData);
        setAuth(authData);
        setLoading(false);
        setChecked(true);
        
        // Clean up URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      } catch (error) {
        console.error('[useTwitterAuth] Failed to parse URL auth data:', error);
      }
    }
    
    // Check for error parameters
    const error = urlParams.get('error');
    if (error) {
      console.log('[useTwitterAuth] Auth error detected:', error);
      setLoading(false);
      setChecked(true);
      return;
    }
    
    // Try reading client-side cookie directly as another backup
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('twitter_auth_client='))
        ?.split('=')[1];
        
      if (cookieValue) {
        console.log('[useTwitterAuth] Found auth in client cookie');
        const authData = JSON.parse(decodeURIComponent(cookieValue));
        setTwitterAuth(authData);
        setAuth(authData);
        setLoading(false);
        setChecked(true);
        return;
      }
    } catch (error) {
      console.error('[useTwitterAuth] Failed to read client cookie:', error);
    }
    
    // Last resort: check server cookie via API
    try {
      console.log('[useTwitterAuth] Checking server for auth...');
      const response = await fetch('/api/auth/twitter/check', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          console.log('[useTwitterAuth] Found auth on server');
          setTwitterAuth(data.user);
          setAuth(data.user);
        } else {
          console.log('[useTwitterAuth] No auth found on server');
        }
      } else {
        console.error('[useTwitterAuth] Server check failed:', response.status);
      }
    } catch (error) {
      console.error('[useTwitterAuth] Auth check error:', error);
    }
    
    setLoading(false);
    setChecked(true);
  }, [checked]);
  
  useEffect(() => {
    if (!checked) {
      checkAuth();
    }
  }, [checked, checkAuth]);
  
  console.log('[useTwitterAuth] Render - loading:', loading, 'auth:', !!auth);
  
  return { auth, loading };
} 
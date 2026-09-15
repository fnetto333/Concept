import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Colaborador } from './types';

export type AuthState = {
  session: Session | null;
  user: User | null;
  colaborador: Colaborador | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchColaborador = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      console.error('Error fetching colaborador:', error);
      return null;
    }
    return data as Colaborador | null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchColaborador(data.session.user.id).then((c) => {
          setColaborador(c);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const c = await fetchColaborador(newSession.user.id);
          setColaborador(c);
        } else {
          setColaborador(null);
        }
        setLoading(false);
      })();
    });
  }, [fetchColaborador]);

  const signIn = useCallback(async (username: string, password: string) => {
    const email = `${username.trim()}@concept.com.br`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setColaborador(null);
  }, []);

  return { session, user, colaborador, loading, signIn, signOut };
}

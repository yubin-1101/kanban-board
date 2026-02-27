import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Profile } from '@kanban/shared';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return (data as Profile | null) ?? null;
}

/**
 * onAuthStateChange 콜백 안에서 async 네트워크 호출을 하면
 * Supabase 내부 lock과 데드락이 발생한다.
 * 따라서 콜백에서는 동기적으로 상태만 갱신하고,
 * 프로필 조회는 setTimeout으로 분리한다.
 */
export function useAuthInit() {
  const { setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let ignored = false;

    // 프로필을 비동기로 가져와서 store에 반영
    function loadProfile(userId: string) {
      fetchProfile(userId)
        .then((prof) => {
          if (!ignored) {
            console.log('[useAuthInit] loadProfile 완료:', prof);
            setProfile(prof);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('[useAuthInit] loadProfile 에러:', err);
          if (!ignored) setLoading(false);
        });
    }

    // onAuthStateChange를 먼저 등록 (getSession보다 먼저)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[onAuthStateChange] event:', event);
      if (ignored) return;

      if (event === 'INITIAL_SESSION') {
        // 앱 시작 시 기존 세션 확인
        if (session?.user) {
          // setTimeout으로 분리하여 데드락 방지
          setTimeout(() => loadProfile(session.user.id), 0);
        } else {
          setLoading(false);
          console.log('[onAuthStateChange] INITIAL_SESSION: 세션 없음');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // setTimeout으로 분리하여 데드락 방지
        setTimeout(() => loadProfile(session.user.id), 0);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      ignored = true;
      subscription.unsubscribe();
    };
  }, [setProfile, setLoading]);
}

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading } = useAuthStore();

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[signInWithEmail] 시작');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[signInWithEmail] 결과:', error?.message ?? '성공');
    if (error) throw error;
    // 프로필은 onAuthStateChange → loadProfile에서 설정됨
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    console.log('[signUpWithEmail] 시작');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    console.log('[signUpWithEmail] 결과:', error?.message ?? '성공');
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return {
    profile,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
}

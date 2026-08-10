import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { buildSeoMeta } from "@/lib/seo";
import { analytics } from "@/lib/analytics";
import { useV3Store } from "@/features/v3/hooks/useV3Store";

export const Route = createFileRoute("/login")({
  head: () =>
    buildSeoMeta({
      title: "Đăng Nhập — Google Auth | Nghiện LOL",
      description: "Đăng nhập tài khoản với Google qua Supabase Authentication.",
      path: "/login",
    }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get initial user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      setLoading(false);
    });

    // 2. Listen to auth state changes (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        analytics.login({ method: "google" });
        navigate({ to: "/random-lol" });
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMsg(null);
      analytics.login({ method: "google" });
      const redirectTo = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoggingIn(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đăng nhập.";
      setErrorMsg(msg);
      setIsLoggingIn(false);
    }
  };

  const { handleLogout: storeLogout } = useV3Store();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setErrorMsg(null);
      await storeLogout();
      setUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đăng xuất.";
      setErrorMsg(msg);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userMeta = user?.user_metadata || {};
  const userName =
    userMeta.full_name ||
    userMeta.name ||
    userMeta.preferred_username ||
    user?.email?.split("@")[0] ||
    "Thành viên";
  const userAvatar = userMeta.avatar_url || userMeta.picture;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <SiteHeader currentPath="/login" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card/80 border border-gold/30 rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Subtle top ambient glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 border border-gold/40 text-gold-bright mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              Tài Khoản
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user ? "Thông tin đăng nhập thành công" : "Đăng nhập để liên kết tài khoản của bạn"}
            </p>
          </div>

          {/* Error notification banner if any */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
              <p className="font-semibold mb-0.5">Lỗi xác thực:</p>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Content Loading State */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-gold-bright animate-spin" />
              <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                Đang kiểm tra trạng thái xác thực...
              </p>
            </div>
          ) : user ? (
            /* Authenticated User View */
            <div className="space-y-6">
              <div className="p-4 rounded-md bg-background/60 border border-gold/20 flex items-center gap-4">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-14 h-14 rounded-full border border-gold/50 object-cover shadow"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold-bright">
                    <UserIcon className="w-7 h-7" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-base text-foreground truncate">
                    {userName}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Google Verified
                  </div>
                </div>
              </div>

              {/* Metadata Details */}
              <div className="p-3.5 rounded bg-muted/30 border border-border/50 text-xs space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Phương thức:</span>
                  <span className="text-foreground font-medium">Google OAuth</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Email:</span>
                  <span className="text-foreground font-mono truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
                {user.created_at && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Đã tham gia:</span>
                    <span className="text-foreground font-mono">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-2.5 px-4 rounded border border-red-500/40 text-red-300 bg-red-950/30 hover:bg-red-900/40 hover:border-red-400 transition-all text-xs font-display uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang đăng xuất...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Đăng Xuất</span>
                    </>
                  )}
                </button>

                <Link
                  to="/random-lol"
                  className="w-full py-2.5 px-4 rounded border border-gold/30 text-gold-bright bg-gold/10 hover:bg-gold/20 transition-all text-xs font-display uppercase tracking-widest font-semibold flex items-center justify-center gap-2 text-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại Tool Random</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Unauthenticated View: Continue with Google Button */
            <div className="space-y-6">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                Đăng nhập bằng tài khoản Google của bạn thông qua dịch vụ bảo mật Supabase
                Authentication.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-md border border-gold/50 bg-gold/10 hover:bg-gold/20 hover:border-gold text-foreground font-display text-sm font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 text-gold-bright animate-spin" />
                    <span>Đang chuyển hướng...</span>
                  </>
                ) : (
                  <>
                    {/* Google G SVG Icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-border/40 text-center">
                <Link
                  to="/random-lol"
                  className="text-xs text-muted-foreground hover:text-gold-bright transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trở về trang chủ mà không cần đăng nhập</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

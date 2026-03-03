"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Trophy,
  Target,
  Zap,
  MapPin,
  Plane,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3 | 4;

const TOTAL_ONBOARDING_STEPS = 4;

const SKILL_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to mahjong or still learning the basics. Looking for lessons and patient groups.",
    icon: Target,
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Comfortable with the rules and strategy. Ready for regular games and open play.",
    icon: Zap,
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Experienced player who knows the game well. Interested in competitive or league play.",
    icon: Trophy,
  },
] as const;

const GAME_STYLES = [
  {
    value: "american",
    label: "American Mahjong",
    description: "Uses NMJL card, 4 players, most popular in the US",
  },
  {
    value: "chinese",
    label: "Chinese / Hong Kong",
    description: "Traditional Chinese rules, Cantonese or MCR style",
  },
  {
    value: "riichi",
    label: "Japanese (Riichi)",
    description: "Japanese rules with riichi, dora, and unique scoring",
  },
  {
    value: "any",
    label: "Any style",
    description: "Open to playing all variations of mahjong",
  },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  // Registration form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding state
  const [isRegistered, setIsRegistered] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [gameStyle, setGameStyle] = useState<string | null>(null);
  const [homeCity, setHomeCity] = useState("");
  const [travelCities, setTravelCities] = useState("");

  // Redirect if already logged in and not in onboarding
  if (user && !authLoading && !isRegistered) {
    router.push("/search");
    return null;
  }

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);
      setIsRegistered(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("An account with this email already exists. Try logging in instead.");
        } else if (err.message.includes("weak-password")) {
          setError("Password is too weak. Use at least 6 characters.");
        } else if (err.message.includes("invalid-email")) {
          setError("Please enter a valid email address.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      setIsRegistered(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("popup-closed-by-user")) {
        // User closed the popup, no error needed
      } else {
        setError("Google sign-up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep < TOTAL_ONBOARDING_STEPS) {
      setOnboardingStep((onboardingStep + 1) as OnboardingStep);
    }
  };

  const handleOnboardingBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep((onboardingStep - 1) as OnboardingStep);
    }
  };

  const handleOnboardingComplete = () => {
    // In production, save preferences to Firestore here
    // For now, just redirect to search
    router.push("/search");
  };

  const handleSkipOnboarding = () => {
    router.push("/search");
  };

  const canProceed = () => {
    switch (onboardingStep) {
      case 1:
        return skillLevel !== null;
      case 2:
        return gameStyle !== null;
      case 3:
        return homeCity.trim().length > 0;
      case 4:
        return true; // travel cities are optional
      default:
        return false;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  // Onboarding Flow
  if (isRegistered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-teal-50/50 via-white to-white">
        <div className="w-full max-w-lg">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">
                Step {onboardingStep} of {TOTAL_ONBOARDING_STEPS}
              </p>
              <button
                onClick={handleSkipOnboarding}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Skip for now
              </button>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_ONBOARDING_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < onboardingStep ? "bg-teal-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {/* Step 1: Skill Level */}
            {onboardingStep === 1 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-slate-900 mb-2">
                  What&apos;s your skill level?
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  This helps us match you with the right games and groups.
                </p>
                <div className="space-y-3">
                  {SKILL_LEVELS.map((level) => {
                    const Icon = level.icon;
                    const isSelected = skillLevel === level.value;
                    return (
                      <button
                        key={level.value}
                        onClick={() => setSkillLevel(level.value)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${isSelected ? "text-teal-900" : "text-slate-800"}`}>
                              {level.label}
                            </p>
                            {isSelected && (
                              <Check className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{level.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Game Style */}
            {onboardingStep === 2 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-slate-900 mb-2">
                  What style do you play?
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  We&apos;ll prioritize games that match your preferred style.
                </p>
                <div className="space-y-3">
                  {GAME_STYLES.map((style) => {
                    const isSelected = gameStyle === style.value;
                    return (
                      <button
                        key={style.value}
                        onClick={() => setGameStyle(style.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${isSelected ? "text-teal-900" : "text-slate-800"}`}>
                              {style.label}
                            </p>
                            {isSelected && (
                              <Check className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{style.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Home City */}
            {onboardingStep === 3 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-slate-900 mb-2">
                  Where are you based?
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  We&apos;ll show you games near your home city first.
                </p>
                <div>
                  <label htmlFor="homeCity" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Home city
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="homeCity"
                      type="text"
                      value={homeCity}
                      onChange={(e) => setHomeCity(e.target.value)}
                      placeholder="e.g., Nashville, TN"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Enter your city and state (e.g., &quot;Denver, CO&quot;)
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Travel Cities */}
            {onboardingStep === 4 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-slate-900 mb-2">
                  Any travel destinations?
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Add cities you visit often so we can alert you about games there. This is totally optional.
                </p>
                <div>
                  <label htmlFor="travelCities" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Travel cities
                  </label>
                  <div className="relative">
                    <Plane className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="travelCities"
                      type="text"
                      value={travelCities}
                      onChange={(e) => setTravelCities(e.target.value)}
                      placeholder="e.g., Miami, Denver, Phoenix"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Separate cities with commas. You can always update this later.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 mt-8">
              {onboardingStep > 1 && (
                <button
                  onClick={handleOnboardingBack}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <div className="flex-1" />
              {onboardingStep < TOTAL_ONBOARDING_STEPS ? (
                <button
                  onClick={handleOnboardingNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleOnboardingComplete}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
                >
                  Find Games
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-teal-50/50 via-white to-white">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-800">
              MahjNearMe
            </span>
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-slate-900 mb-2">
            Start your free trial
          </h1>
          <p className="text-slate-500">
            14 days free. No credit card required.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Google Sign-Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email || !password}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Home, Check, ChevronDown, Settings, ArrowLeftRight, Sparkles } from "lucide-react";

export type ProfileType = "personal" | "casa";

export interface ProfileData {
  id: string;
  name: string;
  photoURL?: string;
  initials?: string;
  subtitle?: string;
}

export interface StackedAvatarsProps {
  /** Active selected profile context */
  activeProfile?: ProfileType;
  /** Personal profile data */
  personalProfile: ProfileData;
  /** Casa / Shared profile data */
  casaProfile?: ProfileData;
  /** Callback when user changes active profile */
  onProfileChange?: (profile: ProfileType) => void;
  /** Callback to open profile or home settings */
  onOpenSettings?: (profile: ProfileType) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional custom trigger className */
  className?: string;
  /** Whether to show inline label next to avatar */
  showLabel?: boolean;
  /** Custom label text override */
  labelOverride?: string;
}

export function StackedAvatars({
  activeProfile = "personal",
  personalProfile,
  casaProfile = { id: "casa", name: "Minha Casa", subtitle: "Gestão compartilhada" },
  onProfileChange,
  onOpenSettings,
  size = "md",
  className = "",
  showLabel = false,
  labelOverride,
}: StackedAvatarsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Size dimensions
  const dimensions = {
    sm: { main: "w-8 h-8 text-xs", rear: "w-7 h-7 text-[10px]", offset: "translate-x-3 translate-y-2", ring: "ring-[2.5px]" },
    md: { main: "w-11 h-11 text-sm", rear: "w-9 h-9 text-xs", offset: "translate-x-4 translate-y-2.5", ring: "ring-[3px]" },
    lg: { main: "w-14 h-14 text-base", rear: "w-11 h-11 text-sm", offset: "translate-x-5 translate-y-3", ring: "ring-[3.5px]" },
  }[size];

  const isPersonalActive = activeProfile === "personal";

  // Determine front and rear profile based on activeProfile
  const frontProfile = isPersonalActive ? personalProfile : casaProfile;
  const rearProfile = isPersonalActive ? casaProfile : personalProfile;
  const frontIsPersonal = isPersonalActive;

  const handleSelect = (profile: ProfileType) => {
    if (onProfileChange) {
      onProfileChange(profile);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Clickable Stacked Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 transition-transform cursor-pointer"
        aria-label="Alternar perfil (Pessoal / Casa)"
        aria-expanded={isOpen}
      >
        {/* Single Avatar Container with Mode Badge */}
        <div className="relative flex items-center justify-center shrink-0">
          <motion.div
            className={`relative ${dimensions.main} rounded-full overflow-hidden bg-card shadow-md flex items-center justify-center transition-all duration-300 group-hover:shadow-lg border-2 ${
              frontIsPersonal ? "border-primary" : "border-violet-500"
            }`}
            layout
          >
            {frontIsPersonal ? (
              // Front is Personal Profile
              personalProfile.photoURL ? (
                <img src={personalProfile.photoURL} alt={personalProfile.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <span className="font-bold text-primary-foreground bg-primary w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {personalProfile.initials || personalProfile.name.charAt(0).toUpperCase()}
                </span>
              )
            ) : (
              // Front is Casa Profile
              casaProfile.photoURL ? (
                <img src={casaProfile.photoURL} alt={casaProfile.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-105">
                  <Home size={size === "sm" ? 14 : size === "md" ? 18 : 22} strokeWidth={2.5} />
                </div>
              )
            )}
          </motion.div>

          {/* Mode Badge (shows small Home icon when on Personal mode, or User icon when on Casa mode) */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 rounded-full p-1 border-2 border-background shadow-sm ${
              frontIsPersonal ? "bg-violet-600 text-white" : "bg-primary text-primary-foreground"
            }`}
          >
            {frontIsPersonal ? (
              <Home size={10} strokeWidth={2.5} />
            ) : (
              <User size={10} strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Optional Text Label */}
        {showLabel && (
          <div className="flex flex-col text-left pr-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-foreground truncate max-w-[110px]">
                {labelOverride || frontProfile.name}
              </span>
              <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              {frontIsPersonal ? "Perfil Pessoal" : "Perfil Casa"}
            </span>
          </div>
        )}
      </button>

      {/* Profile Switching Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-2 w-64 bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl z-50 p-2 overflow-hidden"
          >
            {/* Header / Context title */}
            <div className="px-3 py-2 border-b border-border/40 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <ArrowLeftRight size={12} className="text-primary" />
                <span>Alternar Perfil</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                2 Contextos
              </span>
            </div>

            {/* Profile Options */}
            <div className="space-y-1">
              {/* Option 1: Personal Profile */}
              <button
                type="button"
                onClick={() => handleSelect("personal")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                  isPersonalActive
                    ? "bg-primary/10 border border-primary/20 text-foreground font-semibold"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {personalProfile.photoURL ? (
                      <img src={personalProfile.photoURL} alt={personalProfile.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                        {personalProfile.initials || personalProfile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{personalProfile.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {personalProfile.subtitle || "Conta Pessoal"}
                    </p>
                  </div>
                </div>

                {isPersonalActive && (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Option 2: Casa Profile */}
              <button
                type="button"
                onClick={() => handleSelect("casa")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                  !isPersonalActive
                    ? "bg-violet-500/10 border border-violet-500/20 text-foreground font-semibold"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {casaProfile.photoURL ? (
                      <img src={casaProfile.photoURL} alt={casaProfile.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        <Home size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{casaProfile.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {casaProfile.subtitle || "Finanças Compartilhadas"}
                    </p>
                  </div>
                </div>

                {!isPersonalActive && (
                  <div className="w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            {/* Footer / Settings link if provided */}
            {onOpenSettings && (
              <div className="mt-1 pt-1 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings(activeProfile);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <Settings size={13} />
                  <span>Configurações do perfil</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

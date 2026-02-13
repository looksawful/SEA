"use client";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/utils/i18n";
import { FaCog, FaEnvelope, FaGithub, FaTimes, FaVolumeUp, FaVolumeMute, FaClock, FaMagic } from "react-icons/fa";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const {
    soundEnabled,
    toggleSound,
    backgroundAnimation,
    setBackgroundAnimation,
    timedMode,
    setTimedMode,
    language,
  } = useGameStore();

  const settings = [
    {
      icon: soundEnabled ? FaVolumeUp : FaVolumeMute,
      label: t(language, "sound"),
      description: language === "ru" ? "Звуки правильных и неправильных ответов" : "Sound effects for answers",
      value: soundEnabled,
      toggle: toggleSound,
    },
    {
      icon: FaMagic,
      label: t(language, "backgroundAnimation"),
      description: language === "ru" ? "Анимированный фон Aurora" : "Animated Aurora background",
      value: backgroundAnimation,
      toggle: () => setBackgroundAnimation(!backgroundAnimation),
    },
    {
      icon: FaClock,
      label: t(language, "timedMode"),
      description: language === "ru" ? "Ограничение времени на ответ" : "Time limit for answers",
      value: timedMode,
      toggle: () => setTimedMode(!timedMode),
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="w-full max-w-md bg-surface-2 border border-subtle rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <FaCog className="text-lg" />
            </div>
            <h2 className="text-lg font-display font-semibold">{t(language, "settings")}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-3 border border-subtle flex items-center justify-center text-muted hover:text-strong hover:bg-surface-3 transition-colors"
            aria-label={t(language, "close")}
          >
            <FaTimes />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-4 space-y-2">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <button
                key={index}
                onClick={setting.toggle}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-3 border border-subtle hover:border-accent/30 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  setting.value ? "bg-accent/20 text-accent" : "bg-surface-2 text-muted"
                }`}>
                  <Icon className="text-lg" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-strong">{setting.label}</div>
                  <div className="text-xs text-soft">{setting.description}</div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  setting.value ? "bg-accent" : "bg-surface-2 border border-subtle"
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    setting.value ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-subtle mx-4" />

        {/* Footer Links */}
        <div className="p-4">
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:i@lookawful.ru?subject=SEA%20feedback"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={t(language, "feedback")}
            >
              <FaEnvelope className="text-base" />
              <span className="hidden sm:inline">{t(language, "feedback")}</span>
            </a>
            <a
              href="https://github.com/looksawful/SEA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title="GitHub"
            >
              <FaGithub className="text-base" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a
              href="https://github.com/looksawful/SEA/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={t(language, "license")}
            >
              <span className="text-xs font-mono">MIT</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Roboto_Mono } from "next/font/google";
import RequiredInput from "./components/RequiredInput";
import RequiredTextarea from "./components/RequiredTextarea";

const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400"] });

// ▼▼▼ 設定 ▼▼▼
const ANIM_SETTINGS = {
  duration: {
    float: 0.8,
    open: 0.6,
    rise: 0.7,
    expand: 0.9,
    content: 0.2,
    fadeOut: 0.3,
  },
  delay: { afterFloat: 0.0, afterOpen: 0, afterRise: -0.45, afterExpand: 0.0 },
  interaction: { waitForEnvelope: 1500, autoCloseSuccess: 10000 },
};

const AnimationStyles = () => (
  <style jsx global>{`
    @keyframes float {
      0%,
      100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    @keyframes mesh-pan {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    @keyframes orb-float-1 {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -50px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }
    @keyframes orb-float-2 {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(-30px, 40px) scale(0.9);
      }
      66% {
        transform: translate(20px, -30px) scale(1.1);
      }
    }
    @keyframes orb-float-3 {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(20px, 20px) scale(0.8);
      }
      66% {
        transform: translate(-30px, -20px) scale(1.2);
      }
    }
    @keyframes scale-in {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes breathe-glow {
      0%,
      100% {
        opacity: 0.4;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.15);
      }
    }
    @keyframes mail-float-up {
      0% {
        transform: translateY(140px) scale(0.8);
        opacity: 0;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    @keyframes envelope-open {
      0% {
        transform: rotateX(0deg);
        z-index: 20;
      }
      100% {
        transform: rotateX(180deg);
        z-index: 1;
      }
    }
    @keyframes paper-rise {
      0% {
        transform: translateY(0px);
        height: 0px;
        opacity: 0;
      }
      15% {
        opacity: 1;
      }
      100% {
        transform: translateY(-50px) scale(1.1);
        height: 120px;
        opacity: 1;
      }
    }
    @keyframes envelope-scale-up {
      0% {
        transform: scale(1) translateY(0);
      }
      100% {
        transform: scale(1) translateY(40px);
      }
    }
    @keyframes form-expand-overlay {
      0% {
        clip-path: inset(35% 35% 35% 35% round 32px);
      }
      100% {
        clip-path: inset(0% 0% 0% 0% round 32px);
      }
    }
    @keyframes content-fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes skeleton-fade-out {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
        visibility: hidden;
      }
    }
    .animate-skeleton-fade-out {
      animation: skeleton-fade-out var(--d-fade-out) ease-out forwards;
      animation-delay: var(--d-expand);
    }
    .transition-opacity-visibility {
      transition:
        opacity 300ms ease-in-out,
        visibility 300ms ease-in-out;
    }
    body {
      font-family: "Inter", "Noto Sans JP", sans-serif !important;
      overflow: hidden;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .animate-mesh {
      background-size: 200% 200%;
      animation: mesh-pan 15s ease infinite;
    }
    .animate-orb-1 {
      animation: orb-float-1 20s ease-in-out infinite;
    }
    .animate-orb-2 {
      animation: orb-float-2 25s ease-in-out infinite;
    }
    .animate-orb-3 {
      animation: orb-float-3 22s ease-in-out infinite reverse;
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
    .animate-scale-in {
      animation: scale-in 0.5s ease-out forwards;
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.6s ease-out forwards;
    }
    .animate-breathe-glow {
      animation: breathe-glow 4s ease-in-out infinite;
    }
    .animate-mail-float {
      animation: mail-float-up var(--d-float) ease-out forwards;
    }
    .animate-envelope-open {
      animation: envelope-open var(--d-open) ease-in-out var(--w-open) forwards;
      transform-origin: top;
    }
    .animate-paper-rise {
      animation: paper-rise var(--d-rise) cubic-bezier(0.33, 1, 0.68, 1)
        var(--w-rise) both;
    }
    .animate-envelope-scale {
      animation: envelope-scale-up var(--d-rise)
        cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--w-rise) forwards;
    }
    .animate-form-expand {
      animation: form-expand-overlay var(--d-expand)
        cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-content-fade-in {
      animation: content-fade-in var(--d-content) ease-out forwards;
      animation-delay: calc(
        var(--w-expand) + var(--d-expand) + var(--wait-content)
      );
      opacity: 0;
    }
    .perspective-1000 {
      perspective: 1000px;
    }
    .transform-style-3d {
      transform-style: preserve-3d;
    }
    .backface-hidden {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      -moz-backface-visibility: hidden;
    }
    .rotate-y-180 {
      transform: rotateY(180deg);
    }
    .will-change-transform {
      will-change: transform;
    }
  `}</style>
);

const cn = (...classes) => classes.filter(Boolean).join(" ");

const XIcon = ({ className }) => (
  <svg
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const InstagramIcon = ({ className }) => (
  <svg
    width="17"
    height="17"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308 0.977.975 1.247 2.242 1.308 3.608 0.058 1.266 0.07 1.646 0.07 4.85s-0.012 3.584-0.07 4.85c-0.061 1.366-0.331 2.633-1.308 3.608-0.975 0.977-2.242 1.247-3.608 1.308-1.266 0.058-1.646 0.07-4.85 0.07s-3.584-0.012-4.85-0.07c-1.366-0.061-2.633-0.331-3.608-1.308-0.977-0.975-1.247-2.242-1.308-3.608-0.058-1.266-0.07-1.646-0.07-4.85s0.012-3.584 0.07-4.85c0.062-1.366 0.332-2.633 1.308-3.608 0.975-0.977 2.242-1.247 3.608-1.308 1.266-0.058 1.646-0.07 4.85-0.07zM12 0C8.741 0 8.333 0.014 7.053 0.072 2.695 0.272 0.273 2.69 0.073 7.052 0.014 8.333 0 8.741 0 12s0.014 3.667 0.072 4.947c0.2 4.353 2.614 6.777 6.981 6.98 1.281 0.058 1.689 0.072 4.948 0.072s3.667-0.014 4.948-0.072c4.354-0.2 6.782-2.618 6.979-6.98 0.058-1.28 0.072-1.689 0.072-4.948s-0.014-3.667-0.072-4.947c-0.2-4.353-2.612-6.77-6.979-6.98-1.281-0.058-1.69-0.072-4.949-0.072zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zM12 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zM18.406 4.175c-1.227 0-2.222 0.995-2.222 2.222s0.995 2.222 2.222 2.222 2.222-0.995 2.222-2.222-0.995-2.222-2.222-2.222z" />
  </svg>
);
const GitHubIcon = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 50 50"
    fill="currentColor"
    className={className}
  >
    <path d="M17.791,46.836C18.502,46.53,19,45.823,19,45v-5.4c0-0.197,0.016-0.402,0.041-0.61C19.027,38.994,19.014,38.997,19,39 c0,0-3,0-3.6,0c-1.5,0-2.8-0.6-3.4-1.8c-0.7-1.3-1-3.5-2.8-4.7C8.9,32.3,9.1,32,9.7,32c0.6,0.1,1.9,0.9,2.7,2c0.9,1.1,1.8,2,3.4,2 c2.487,0,3.82-0.125,4.622-0.555C21.356,34.056,22.649,33,24,33v-0.025c-5.668-0.182-9.289-2.066-10.975-4.975 c-3.665,0.042-6.856,0.405-8.677,0.707c-0.058-0.327-0.108-0.656-0.151-0.987c1.797-0.296,4.843-0.647,8.345-0.714 c-0.112-0.276-0.209-0.559-0.291-0.849c-3.511-0.178-6.541-0.039-8.187,0.097c-0.02-0.332-0.047-0.663-0.051-0.999 c1.649-0.135,4.597-0.27,8.018-0.111c-0.079-0.5-0.13-1.011-0.13-1.543c0-1.7,0.6-3.5,1.7-5c-0.5-1.7-1.2-5.3,0.2-6.6 c2.7,0,4.6,1.3,5.5,2.1C21,13.4,22.9,13,25,13s4,0.4,5.6,1.1c0.9-0.8,2.8-2.1,5.5-2.1c1.5,1.4,0.7,5,0.2,6.6c1.1,1.5,1.7,3.2,1.6,5 c0,0.484-0.045,0.951-0.11,1.409c3.499-0.172,6.527-0.034,8.204,0.102c-0.002,0.337-0.033,0.666-0.051,0.999 c-1.671-0.138-4.775-0.28-8.359-0.089c-0.089,0.336-0.197,0.663-0.325,0.98c3.546,0.046,6.665,0.389,8.548,0.689 c-0.043,0.332-0.093,0.661-0.151,0.987c-1.912-0.306-5.171-0.664-8.879-0.682C35.112,30.873,31.557,32.75,26,32.969V33 c2.6,0,5,3.9,5,6.6V45c0,0.823,0.498,1.53,1.209,1.836C41.37,43.804,48,35.164,48,25C48,12.318,37.683,2,25,2S2,12.318,2,25 C2,35.164,8.63,43.804,17.791,46.836z"></path>
  </svg>
);
const MailIcon = ({ className }) => (
  <svg
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 640 640"
    className={className}
  >
    <path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z" />
  </svg>
);
const HeartIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-pink-500"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);
const MapPinIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-blue-500"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const INITIAL_SOCIAL_DATA = {
  X: {
    title: "X",
    description: "ガジェットや趣味についてを気軽に。",
    color: "from-gray-800 to-gray-900",
    accent: "text-slate-800 bg-slate-100 border-slate-200",
    handle: "@Ihurah_com",
    url: "https://x.com/Ihurah_com",
    activities: [],
  },
  Instagram: {
    title: "Instagram",
    description: "写真の統一感を大切に。",
    color: "from-fuchsia-500 to-orange-500",
    accent: "text-pink-600 bg-pink-50 border-pink-100",
    handle: "@Ihurah_com",
    url: "https://www.instagram.com/ihurah_com/",
    activities: [],
  },
  GitHub: {
    title: "GitHub",
    description: "自己満なコードを雑に。",
    color: "from-gray-700 to-gray-900",
    accent: "text-slate-900 bg-slate-100 border-slate-200",
    handle: "Ihurah",
    url: "https://github.com/Ihurah",
    activities: [],
  },
  MAIL: {
    title: "Contact",
    description: (
      <>
        サイトの不具合・ご要望はこちらから。
        <br />
        その他のご連絡も。
      </>
    ),
    color: "from-blue-500 to-indigo-600",
    accent: "text-blue-600 bg-blue-50 border-blue-100",
    handle: "in@ed1t.jp",
    url: "mailto:in@ed1t.jp",
  },
};

const LANGUAGE_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#00ADD8",
  PHP: "#4F5D95",
  Ruby: "#701516",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  Dart: "#F05138",
  Vue: "#41b883",
  React: "#61dafb",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  default: "#ccc",
};

const THEMES = [
  {
    name: "Sunset",
    gradient: "from-indigo-600 via-purple-500 to-pink-500",
    orbs: ["bg-blue-400/30", "bg-pink-400/20", "bg-purple-300/20"],
    accent: "text-indigo-600 bg-indigo-50 border-indigo-100/50",
  },
  {
    name: "Ocean",
    gradient: "from-blue-600 via-cyan-500 to-teal-400",
    orbs: ["bg-white/20", "bg-cyan-300/30", "bg-blue-300/20"],
    accent: "text-cyan-600 bg-cyan-50 border-cyan-100/50",
  },
  {
    name: "Forest",
    gradient: "from-emerald-600 via-green-500 to-lime-500",
    orbs: ["bg-yellow-300/20", "bg-emerald-300/30", "bg-white/20"],
    accent: "text-emerald-600 bg-emerald-50 border-emerald-100/50",
  },
  {
    name: "Berry",
    gradient: "from-fuchsia-600 via-pink-600 to-rose-500",
    orbs: ["bg-indigo-400/30", "bg-rose-300/20", "bg-fuchsia-300/20"],
    accent: "text-pink-600 bg-pink-50 border-pink-100/50",
  },
  {
    name: "Midnight",
    gradient: "from-slate-900 via-indigo-900 to-slate-800",
    orbs: ["bg-indigo-500/30", "bg-purple-500/20", "bg-blue-500/20"],
    accent: "text-slate-700 bg-slate-100 border-slate-200",
  },
];

const SocialIntroCard = ({
  onFlipBack,
  onForceScrollTop,
  selectedSocial,
  socialData,
}) => {
  const data = selectedSocial ? socialData[selectedSocial] : null;
  const [mailStep, setMailStep] = useState("intro");
  const [formView, setFormView] = useState("input");
  const [formData, setFormData] = useState({ name: "", email: "", body: "" });
  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const onFlipBackRef = useRef(onFlipBack);
  const onForceScrollTopRef = useRef(onForceScrollTop);

  useEffect(() => {
    onFlipBackRef.current = onFlipBack;
    onForceScrollTopRef.current = onForceScrollTop;
  }, [onFlipBack, onForceScrollTop]);

  useEffect(() => {
    setMailStep("intro");
    setFormView("input");
    setFormData({ name: "", email: "", body: "" });
    setErrors({});
    setIsSending(false);
  }, [selectedSocial]);

  // スクロールを上にスムーズに移動（紙が拡大される時）
  useEffect(() => {
    if (mailStep === "animating") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    // フォーム展開完了後にもスクロール
    if (mailStep === "form") {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 200); // アニメーション完了後のタイミング
    }
  }, [mailStep]);

  const animStyles = useMemo(() => {
    const { duration: d, delay: w } = ANIM_SETTINGS;
    const totalDuration =
      d.float + w.afterFloat + d.open + w.afterOpen + d.rise;
    const switchTimeMs = totalDuration * 1000 - 200;
    return {
      cssVars: {
        "--d-float": `${d.float}s`,
        "--d-open": `${d.open}s`,
        "--w-open": `${d.float + w.afterFloat}s`,
        "--d-rise": `${d.rise}s`,
        "--w-rise": `${d.float + w.afterFloat + d.open + w.afterOpen}s`,
        "--d-expand": `${d.expand}s`,
        "--w-expand": "0s",
        "--d-content": `${d.content}s`,
        "--wait-content": "0s",
        "--d-fade-out": `${d.fadeOut}s`,
      },
      switchTimeMs,
    };
  }, []);

  useEffect(() => {
    if (formView === "success") {
      onForceScrollTopRef.current?.();
      const timer = setTimeout(
        () => onFlipBackRef.current(),
        ANIM_SETTINGS.interaction.autoCloseSuccess,
      );
      return () => clearTimeout(timer);
    }
  }, [formView]);

  if (!data) return null;

  const activities = data.activities || [];
  const headerType =
    activities.length > 0 ? activities[0].type : "LATEST ACTIVITY";

  const SocialIconLarge = () => {
    const iconClass = "w-16 h-16 text-white";
    if (selectedSocial === "X") return <XIcon className={iconClass} />;
    if (selectedSocial === "Instagram")
      return <InstagramIcon className={iconClass} />;
    if (selectedSocial === "GitHub")
      return <GitHubIcon className={iconClass} />;
    if (selectedSocial === "MAIL") return <MailIcon className={iconClass} />;
    return null;
  };

  const handleMailClick = (e) => {
    e.preventDefault();
    setMailStep("icon_only");
    setTimeout(() => {
      setMailStep("animating");
      setTimeout(() => {
        setMailStep("form");
      }, animStyles.switchTimeMs);
    }, ANIM_SETTINGS.interaction.waitForEnvelope);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.email.trim()) newErrors.email = true;
    if (!formData.body.trim()) newErrors.body = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const onConfirm = () => {
    if (validate()) setFormView("confirm");
  };
  const onBackToInput = () => {
    setFormView("input");
  };

  const onSend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "送信失敗");
      setFormView("success");
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-[32px] bg-white shadow-2xl w-full h-auto"
      style={animStyles.cssVars}
    >
      <div
        className={cn(
          "flex flex-col z-10 transition-opacity duration-300",
          mailStep === "form"
            ? "opacity-0 pointer-events-none"
            : "relative h-auto opacity-100",
          mailStep === "animating" ? "blur-sm opacity-50" : "",
        )}
      >
        <div
          className={cn(
            "relative h-36 sm:h-44 overflow-hidden bg-gradient-to-r",
            data.color,
          )}
        >
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-10 pt-2 pb-3 sm:pb-2 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-8 mb-5 sm:mb-8">
            <div className="relative animate-float">
              <div
                className={cn(
                  "flex items-center justify-center w-32 h-32 rounded-[28px] border-[6px] border-white shadow-xl bg-gradient-to-br",
                  data.color,
                )}
              >
                <SocialIconLarge />
              </div>
            </div>
            <div className="text-center sm:text-left pb-2">
              <h2 className="text-[27px] font-black text-slate-800 tracking-thight">
                {data.title}
              </h2>
              <span
                className={cn(
                  "inline-block mt-3 text-[10px] font-[700] px-[1em] py-[0.3em] rounded-2xl tracking-[0.13em] border",
                  data.accent,
                )}
              >
                {data.handle}
              </span>
            </div>
          </div>
          <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 mb-6 shadow-[inset_2px_2px_7px_rgba(0,0,0,0.12)]">
            <p className="text-[13px] sm:text-base leading-loose text-slate-600 font-medium tracking-[0.04rem]">
              {data.description}
            </p>
          </div>

          {activities.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {headerType}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {activities.map((activity, index) => (
                  <a
                    key={index}
                    href={activity.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:bg-[#fbfbfb] transition-all duration-300 cursor-pointer group relative z-20",
                      // スマホでは2件、PC(sm以上)では1件表示
                      index > 0 && "sm:hidden",
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 font-medium leading-relaxed truncate group-hover:text-blue-600 transition-colors">
                          {activity.text}
                        </p>
                        <svg
                          className="w-3 h-3 text-slate-300 group-hover:text-blue-400 transition-colors ml-2 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        {/* 日付 */}
                        <span
                          className={cn(
                            "text-[10px] text-slate-400",
                            robotoMono.className,
                          )}
                        >
                          {activity.date.split(".").map((part, i, arr) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="mx-[-1.5px] text-slate-400">
                                  .
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </span>

                        {/* メタ情報 (言語/いいね/場所) */}
                        {activity.meta && (
                          <div className="flex items-center gap-1.5">
                            {activity.meta.type === "language" && (
                              <>
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      LANGUAGE_COLORS[activity.meta.value] ||
                                      LANGUAGE_COLORS.default,
                                  }}
                                />
                                <span className="text-[10px] font-medium text-slate-500">
                                  {activity.meta.value}
                                </span>
                              </>
                            )}
                            {activity.meta.type === "likes" && (
                              <>
                                <HeartIcon />
                                <span className="text-[10px] font-medium text-slate-500">
                                  {activity.meta.value}
                                </span>
                              </>
                            )}
                            {activity.meta.type === "location" && (
                              <>
                                <MapPinIcon />
                                <span className="text-[10px] font-medium text-slate-500 max-w-[80px] truncate">
                                  {activity.meta.value}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4 sm:mt-auto">
            {selectedSocial === "MAIL" ? (
              <button
                onClick={handleMailClick}
                disabled={mailStep !== "intro"}
                className={cn(
                  "flex items-center justify-center gap-2 font-bold rounded-xl text-white shadow-lg transition-all duration-300 ease-out relative overflow-hidden cursor-pointer bg-gradient-to-r hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
                  data.color,
                  "w-full px-6 py-4",
                  (mailStep === "animating" || mailStep === "form") &&
                    "opacity-0 scale-0",
                )}
              >
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    mailStep === "icon_only"
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100",
                  )}
                >
                  メールを送る
                </span>
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    mailStep === "icon_only"
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-0",
                  )}
                >
                  <MailIcon className="w-6 h-6" />
                </div>
              </button>
            ) : (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 w-full px-6 py-4 font-bold rounded-xl !text-white shadow-lg transition-all duration-300 ease-out hover:opacity-95 hover:shadow-xl hover:-translate-y-[1.0px] active:scale-95 cursor-pointer bg-gradient-to-r",
                  data.color,
                )}
              >
                フォローする
              </a>
            )}
            <button
              onClick={onFlipBack}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-4 sm:mb-2 font-bold text-slate-500 hover:text-slate-600 transition-colors cursor-pointer duration-200",
                mailStep !== "intro" &&
                  mailStep !== "icon_only" &&
                  "opacity-0 pointer-events-none",
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              戻る
            </button>
          </div>
        </div>
      </div>

      {/* Animation & Form Layer */}
      {mailStep === "animating" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-envelope-scale">
          <div className="relative w-32 h-20 bg-blue-500 rounded-md shadow-2xl animate-mail-float flex justify-center items-end">
            <div className="absolute inset-0 bg-blue-700 rounded-md"></div>
            <div
              className="absolute bottom-0 w-[92%] bg-white rounded-xl shadow-sm animate-paper-rise z-10 flex flex-col overflow-hidden border border-slate-100 opacity-0"
              style={{ height: 0 }}
            >
              <div className="h-4 w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 shrink-0"></div>
              <div className="p-2 space-y-2 flex-1">
                <div className="w-full h-2 bg-slate-100 rounded"></div>
                <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                <div className="w-full h-full bg-slate-50 rounded"></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-full z-20">
              <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[48px] border-b-[30px] sm:border-l-[64px] sm:border-b-[40px] border-l-transparent border-b-blue-600/90 rounded-bl-md"></div>
              <div className="absolute bottom-0 right-0 w-0 h-0 border-r-[48px] border-b-[30px] sm:border-r-[64px] sm:border-b-[40px] border-r-transparent border-b-blue-600/90 rounded-br-md"></div>
              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-blue-600 to-transparent opacity-50 rounded-b-md"></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-0 border-l-[48px] border-r-[48px] border-t-[30px] sm:border-l-[64px] sm:border-r-[64px] sm:border-t-[40px] border-l-transparent border-r-transparent border-t-blue-500 origin-top z-30 animate-envelope-open rounded-t-md filter drop-shadow-md"></div>
          </div>
        </div>
      )}

      {mailStep === "form" && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white animate-form-expand rounded-[32px] overflow-hidden shadow-[0_0_0_2px_#fff] w-full h-full">
          <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex items-center px-6 gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <MailIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-slate-800 relative h-6 w-full overflow-hidden">
                <span
                  className={cn(
                    "absolute inset-0 flex items-center transition-all duration-300 ease-in-out",
                    formView === "input"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-4",
                  )}
                >
                  New Message
                </span>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center transition-all duration-300 ease-in-out",
                    formView === "confirm"
                      ? "opacity-100 translate-y-0"
                      : formView === "input"
                        ? "opacity-0 translate-y-4"
                        : "opacity-0 -translate-y-4",
                  )}
                >
                  Confirmation
                </span>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center transition-all duration-300 ease-in-out",
                    formView === "success"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4",
                  )}
                >
                  Sent!
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                TO: {data.handle}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex-1 flex flex-col py-6 overflow-y-auto no-scrollbar",
              formView === "success" && "items-center justify-center",
            )}
          >
            {formView === "input" && (
              <div className="px-6 flex flex-col gap-4 animate-fade-in-up">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <div
                    className="space-y-1 animate-content-fade-in relative z-30"
                    style={{
                      animationDelay:
                        "calc(var(--w-expand) + var(--d-expand) + var(--wait-content) + 0.0s)",
                    }}
                  >
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Name
                    </label>
                    <RequiredInput
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                      placeholder="お名前を入力"
                    />
                  </div>
                  <div
                    className="space-y-1 animate-content-fade-in relative z-20"
                    style={{
                      animationDelay:
                        "calc(var(--w-expand) + var(--d-expand) + var(--wait-content) + 0.1s)",
                    }}
                  >
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Email
                    </label>
                    <RequiredInput
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                      placeholder="メールアドレス"
                    />
                  </div>
                  <div
                    className="space-y-1 animate-content-fade-in relative z-10"
                    style={{
                      animationDelay:
                        "calc(var(--w-expand) + var(--d-expand) + var(--wait-content) + 0.2s)",
                    }}
                  >
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Body
                    </label>
                    <RequiredTextarea
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      error={errors.body}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[120px] placeholder:text-slate-300 leading-relaxed"
                      placeholder="お問い合わせ内容をご記入ください..."
                    />
                  </div>
                </div>
              </div>
            )}
            {formView === "confirm" && (
              <div className="px-6 flex flex-col gap-4 animate-fade-in-up">
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-5">
                  <p className="text-xs text-center text-slate-500 font-bold mb-2">
                    以下の内容で送信しますか？
                  </p>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Name
                    </span>
                    <p className="text-sm font-medium text-slate-700 px-1">
                      {formData.name}
                    </p>
                  </div>
                  <div className="w-full h-[1px] bg-slate-100"></div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Email
                    </span>
                    <p className="text-sm font-medium text-slate-700 px-1 break-all">
                      {formData.email}
                    </p>
                  </div>
                  <div className="w-full h-[1px] bg-slate-100"></div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Body
                    </span>
                    <p className="text-sm font-medium text-slate-700 px-1 whitespace-pre-wrap leading-relaxed">
                      {formData.body}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {formView === "success" && (
              <div className="px-6 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-10 h-10 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">
                    Thank you!
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    お問い合わせありがとうございます。
                    <br />
                    内容を確認次第、ご連絡いたします。
                  </p>
                </div>
              </div>
            )}
            <div
              className="absolute inset-0 p-6 flex flex-col gap-4 z-20 bg-white/0 pointer-events-none animate-skeleton-fade-out"
              aria-hidden="true"
            >
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4 h-full opacity-60">
                <div className="space-y-1">
                  <div className="w-10 h-3 bg-slate-200 rounded"></div>
                  <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-10 h-3 bg-slate-200 rounded"></div>
                  <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-10 h-3 bg-slate-200 rounded"></div>
                  <div className="w-full h-32 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 relative z-40">
            {formView === "input" && (
              <>
                <button
                  onClick={onFlipBack}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all flex items-center justify-center gap-2 transform cursor-pointer"
                >
                  確認画面へ
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            {formView === "confirm" && (
              <>
                <button
                  onClick={onBackToInput}
                  disabled={isSending}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  修正する
                </button>
                <button
                  onClick={onSend}
                  disabled={isSending}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2",
                    isSending
                      ? "bg-slate-400 shadow-none cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98] cursor-pointer",
                  )}
                >
                  {isSending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      送信中...
                    </>
                  ) : (
                    <>
                      送信する
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}
            {formView === "success" && (
              <button
                onClick={onFlipBack}
                className="w-full px-4 py-3 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                戻る
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DeveloperProfile() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [status, setStatus] = useState("offline");
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);
  const [socialData, setSocialData] = useState(INITIAL_SOCIAL_DATA);
  const timeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const isScrollingRef = useRef(false);

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [cardHeight, setCardHeight] = useState("auto");

  // 初期の高さを適切に扱うため
  const isClient = typeof window !== "undefined";

  // スムーズな高さ変更のためのResizeObserver監視
  useEffect(() => {
    const activeRef = isFlipped ? backRef.current : frontRef.current;
    if (!activeRef) return;

    let animationFrameId;
    const observer = new ResizeObserver(() => {
      animationFrameId = requestAnimationFrame(() => {
        setCardHeight(`${activeRef.offsetHeight}px`);
      });
    });

    observer.observe(activeRef);
    if (activeRef.offsetHeight) {
      setCardHeight(`${activeRef.offsetHeight}px`);
    }

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isFlipped]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/users/Ihurah/repos?sort=created&direction=desc&per_page=2",
        );
        if (res.ok) {
          const repos = await res.json();
          const newActivities = repos.map((repo) => {
            const created = new Date(repo.created_at);
            const displayDate = `${created.getFullYear()}.${String(created.getMonth() + 1).padStart(2, "0")}.${String(created.getDate()).padStart(2, "0")}`;
            return {
              type: "LATEST REPOSITORY",
              text: repo.name,
              date: displayDate,
              url: repo.html_url,
              meta: { type: "language", value: repo.language },
            };
          });

          if (newActivities.length > 0) {
            setSocialData((prev) => ({
              ...prev,
              GitHub: { ...prev.GitHub, activities: newActivities },
            }));
          }
        }
      } catch (error) {
        console.error("GitHub API Error:", error);
      }

      try {
        const res = await fetch("/api/x");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            const newActivities = data.map((item) => ({
              type: "LATEST POST",
              text: item.text,
              date: item.date,
              url: item.url,
              meta: { type: "likes", value: item.likes },
            }));
            setSocialData((prev) => ({
              ...prev,
              X: { ...prev.X, activities: newActivities },
            }));
          }
        }
      } catch (error) {
        console.error("X Fetch Error:", error);
      }

      try {
        const res = await fetch("/api/instagram");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            const newActivities = data.map((item) => ({
              type: "LATEST POST",
              text: item.text,
              date: item.date,
              url: item.url,
              meta: item.location
                ? { type: "location", value: item.location }
                : null,
            }));
            setSocialData((prev) => ({
              ...prev,
              Instagram: { ...prev.Instagram, activities: newActivities },
            }));
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };
    fetchSocials();
  }, []);

  // 15秒ごとに自動でテーマを変更
  useEffect(() => {
    const interval = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % THEMES.length);
    }, 15000); // 15秒
    return () => clearInterval(interval);
  }, []);
  const handleSocialClick = (name) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSelectedSocial(name);
    setIsFlipped(true);
  };
  const handleFlipBack = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsFlipped(false);
    timeoutRef.current = setTimeout(() => {
      setSelectedSocial(null);
      timeoutRef.current = null;
    }, 700);
  };
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  const currentTheme = THEMES[themeIndex];

  // Easing関数 (easeOutQuart - より滑らか)
  const easeOutQuart = (t) => {
    return 1 - Math.pow(1 - t, 4);
  };

  // 強制スクロール停止関数
  const cancelScrollAnimation = () => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    isScrollingRef.current = false;
  };

  // スムーズなスクロール関数
  const smoothScrollToTop = (element) => {
    if (!element) return;
    cancelScrollAnimation(); // 既存の強制スクロールがあればキャンセル

    const startTop = element.scrollTop;
    if (startTop === 0) return;

    const duration = 1650;
    const startTime = performance.now();
    isScrollingRef.current = true;

    const scroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      element.scrollTop = startTop * (1 - easedProgress);

      if (progress < 1 && isScrollingRef.current) {
        scrollAnimationRef.current = requestAnimationFrame(scroll);
      } else {
        scrollAnimationRef.current = null;
        isScrollingRef.current = false;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(scroll);
  };

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 1 && hour < 17) {
        setStatus("offline");
        return;
      }
      setStatus("online");
    };
    updateStatus();
    const interval = setInterval(updateStatus, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // SNSカード選択時やメールページ遷移時にスクロール上移動
  useEffect(() => {
    if (selectedSocial && scrollContainerRef.current) {
      smoothScrollToTop(scrollContainerRef.current);
    }
  }, [selectedSocial]);

  // カードがめくられるときにスクロール上へ移動
  useEffect(() => {
    if (isFlipped && scrollContainerRef.current) {
      // カードのめくる時間(700ms)のほぼ終わり頃(600ms)からスクロール開始
      const timer = setTimeout(() => {
        smoothScrollToTop(scrollContainerRef.current);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFlipped]);

  // ユーザーのスクロール操作を検出して強制スクロールをキャンセル
  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const handleScroll = () => {
      if (!isScrollingRef.current) {
        cancelScrollAnimation();
      }
    };

    const stopForcedScroll = () => {
      cancelScrollAnimation();
    };

    const handleWheel = () => {
      stopForcedScroll();
    };

    const handleTouchStart = () => {
      stopForcedScroll();
    };

    const handleTouchMove = () => {
      stopForcedScroll();
    };

    const handlePointerDown = () => {
      stopForcedScroll();
    };

    element.addEventListener("scroll", handleScroll);
    element.addEventListener("wheel", handleWheel);
    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove);
    element.addEventListener("pointerdown", handlePointerDown);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      element.removeEventListener("wheel", handleWheel);
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const statusConfig = {
    online: { color: "bg-green-500" },
    away: { color: "bg-yellow-500" },
    offline: { color: "bg-slate-400" },
  }[status] || { color: "bg-slate-400" };

  const snsLinks = [
    { name: "X", icon: <XIcon />, color: "text-slate-800" },
    { name: "Instagram", icon: <InstagramIcon />, color: "text-slate-700" },
    { name: "GitHub", icon: <GitHubIcon />, color: "text-slate-900" },
  ];
  const contactLinks = [{ name: "MAIL", icon: <MailIcon /> }];

  return (
    <div
      className="fixed inset-0 w-full h-full bg-gray-50 overflow-hidden flex flex-col"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 12px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
      }}
    >
      <AnimationStyles />
      <div className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div
          className={cn(
            "absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5 transition-all duration-1000",
            currentTheme.orbs[0],
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-5 transition-all duration-1000",
            currentTheme.orbs[1],
          )}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar flex items-start sm:items-center justify-center p-4 sm:p-6 py-6"
      >
        <div className="w-full max-w-lg relative z-10 perspective-1000">
          <div
            className={cn(
              "relative w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform-style-3d will-change-transform",
              isFlipped ? "rotate-y-180" : "",
            )}
            style={
              isClient && cardHeight !== "auto" ? { height: cardHeight } : {}
            }
          >
            <div
              className={cn(
                "backface-hidden w-full bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden",
                isFlipped
                  ? "absolute top-0 left-0 pointer-events-none z-10"
                  : "relative z-20",
                cardHeight !== "auto" ? "h-full" : "h-auto",
              )}
            >
              <div ref={frontRef} className="relative w-full h-auto">
                <div className="relative h-38 sm:h-44 overflow-hidden">
                  {THEMES.map((theme, index) => (
                    <div
                      key={theme.name}
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br animate-mesh transition-opacity duration-[4000ms] ease-in-out",
                        theme.gradient,
                        themeIndex === index ? "opacity-100" : "opacity-0",
                      )}
                    />
                  ))}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                </div>
                <div className="px-10 pt-2 pb-10 flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-8 mb-5 sm:mb-8">
                    <div className="relative animate-float">
                      <img
                        src="/developer-icon.jpg"
                        alt="いふ"
                        className="w-32 h-32 rounded-[28px] border-[6px] border-white bg-white object-cover shadow-xl hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center">
                        <div
                          className={cn(
                            "relative inline-flex rounded-full h-full w-full border-4 border-white shadow-sm transition-colors duration-700 ease-in-out",
                            statusConfig.color,
                          )}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center sm:text-left pb-2">
                      <h1 className="text-[27px] font-black text-slate-800 tracking-tight">
                        いふ
                      </h1>
                      <span
                        className={cn(
                          "inline-block mt-2 text-[10px] font-[700] px-[1em] py-[0.3em] rounded-2xl tracking-[0.15em] uppercase border transition-colors duration-700",
                          currentTheme.accent,
                        )}
                      >
                        EDITOR
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 mb-6 shadow-[inset_2px_2px_9px_rgba(0,0,0,0.13)]">
                    <p className="text-[13px] sm:text-base leading-loose text-slate-600 font-medium tracking-[0.04rem]">
                      趣味でWeb開発。アマチュア高校生エディター。
                      <br />
                      不具合や改善についてはSNSやメールにて。
                    </p>
                  </div>
                  <div className="space-y-6 sm:space-y-8">
                    <div>
                      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-200"></span>
                        Connect
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {snsLinks.map((link, i) => (
                          <button
                            key={link.name}
                            onClick={() => handleSocialClick(link.name)}
                            className="group flex items-center justify-center gap-2 px-3 py-3.5 bg-white border border-slate-200 rounded-xl transition-all duration-300 cursor-pointer hover:border-slate-300/80 hover:bg-slate-50/60"
                            style={{
                              animationDelay: `${i * 100}ms`,
                              animationFillMode: "forwards",
                            }}
                          >
                            <span className={cn(link.color)}>{link.icon}</span>
                            <span className="text-xs font-bold text-slate-600">
                              {link.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-200"></span>
                        Contact
                      </h2>
                      <div
                        className="animate-fade-in-up"
                        style={{ animationDelay: "300ms" }}
                      >
                        {contactLinks.map((link) => (
                          <button
                            key={link.name}
                            onClick={() => handleSocialClick(link.name)}
                            className="w-full group flex items-center justify-center gap-3 px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl transition-all duration-300 shadow-lg shadow-slate-200 cursor-pointer hover:bg-slate-900/93"
                          >
                            <span className="text-slate-300 group-hover:text-slate-100 transition-colors duration-300">
                              {link.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-300 tracking-widest group-hover:text-slate-100 transition-colors duration-300">
                              {link.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FRONT FACE END WRAPPER */}
            </div>

            {/* BACK FACE */}
            <div
              className={cn(
                "backface-hidden rotate-y-180 w-full bg-white rounded-[32px] overflow-hidden shadow-2xl",
                !isFlipped
                  ? "absolute top-0 left-0 pointer-events-none z-10"
                  : "relative z-20",
                cardHeight !== "auto" ? "h-full" : "h-auto",
              )}
            >
              <div ref={backRef} className="relative w-full h-auto">
                <SocialIntroCard
                  onFlipBack={handleFlipBack}
                  onForceScrollTop={() =>
                    smoothScrollToTop(scrollContainerRef.current)
                  }
                  selectedSocial={selectedSocial}
                  socialData={socialData}
                />
              </div>
            </div>
          </div>
          <footer
            className="mt-10 text-center animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <p className="select-none text-[10px] font-bold text-slate-300 tracking-[0.2em]">
              © {new Date().getFullYear()} DEVELOPED BY いふ
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

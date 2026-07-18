// Curated discussion topics organized by category.
// Each prebuilt topic gets a stable id so it can be favourited / referenced.

export type CategoryId =
  | "philosophy"
  | "technology"
  | "hypothetical"
  | "relationships"
  | "career"
  | "creative"
  | "ethics"
  | "culture";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  /** Tailwind text color class for accents/badges */
  text: string;
  /** Tailwind bg tint class (soft) */
  bg: string;
  /** Tailwind border class */
  border: string;
  /** A solid dot color */
  dot: string;
  /** Lucide icon name (resolved on the client) */
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "philosophy",
    label: "Philosophy",
    description: "Deep questions about life, mind & meaning",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    dot: "bg-violet-500",
    icon: "Brain",
  },
  {
    id: "technology",
    label: "Technology",
    description: "The future, gadgets & digital life",
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
    icon: "Cpu",
  },
  {
    id: "hypothetical",
    label: "Hypothetical",
    description: "What-if scenarios & wild imagination",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    icon: "Rocket",
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "People, connection & social dynamics",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
    icon: "Users",
  },
  {
    id: "career",
    label: "Career",
    description: "Work, ambition & professional growth",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: "Briefcase",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Imagination, art & storytelling",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    dot: "bg-fuchsia-500",
    icon: "Palette",
  },
  {
    id: "ethics",
    label: "Ethics & Debate",
    description: "Tricky dilemmas worth arguing about",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
    icon: "Scale",
  },
  {
    id: "culture",
    label: "Travel & Culture",
    description: "Places, traditions & ways of living",
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    dot: "bg-pink-500",
    icon: "Globe",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export function getCategoryMeta(id: string): CategoryMeta {
  return (
    CATEGORY_MAP[id as CategoryId] ?? {
      id: "creative" as CategoryId,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      description: "",
      text: "text-fuchsia-600 dark:text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/30",
      dot: "bg-fuchsia-500",
      icon: "Sparkles",
    }
  );
}

export interface Topic {
  id: string;
  text: string;
  category: CategoryId;
  source: "prebuilt" | "custom";
}

// The curated, prebuilt topic bank.
const RAW_TOPICS: Record<CategoryId, string[]> = {
  philosophy: [
    "If you could know the absolute truth to one question, what would you ask?",
    "Is it better to be a satisfied pig or a dissatisfied Socrates?",
    "Does free will truly exist, or is it an illusion created by our brain?",
    "What gives a human life meaning — achievement, connection, or something else?",
    "If a tree falls in a forest and no one hears it, does it make a sound?",
    "Can morality exist without religion or a higher power?",
    "Is identity something you're born with or something you create?",
    "Would you rather know how the universe ends or how it began?",
    "Are we the same person we were ten years ago?",
    "Is suffering necessary to appreciate happiness?",
    "Can a society be truly just, or is justice always partial?",
    "Does language shape thought, or does thought shape language?",
  ],
  technology: [
    "Will AI eventually make most current jobs obsolete?",
    "Should there be a universal right to disconnect from the internet?",
    "Is social media a net positive or net negative for humanity?",
    "Would you upload your consciousness to a computer if you could?",
    "Should children under 16 be banned from smartphones?",
    "Is technological progress always a good thing?",
    "Could humanity survive a complete collapse of the digital infrastructure?",
    "Should algorithms that shape public opinion be regulated?",
    "Is privacy a fundamental human right in the digital age?",
    "Will cryptocurrency replace traditional money in your lifetime?",
    "Do smart homes make us safer or more vulnerable?",
    "Is the metaverse the future of human interaction?",
  ],
  hypothetical: [
    "If you could have dinner with any historical figure, who would it be?",
    "What would you do if you could pause time for everyone but yourself?",
    "If you had to relive one day of your life forever, which would it be?",
    "Would you take a pill that guaranteed success but removed all surprise?",
    "If animals could talk for one day, what would change?",
    "You can master any skill instantly — which do you choose?",
    "If you could teleport anywhere right now, where would you go?",
    "Would you rather know the future or change the past?",
    "If you could only keep five possessions, what would they be?",
    "What would society look like if no one needed sleep?",
    "If you could be fluent in every language, would you travel more?",
    "Would you accept immortality if everyone you loved stayed mortal?",
  ],
  relationships: [
    "What makes a friendship last a lifetime?",
    "Is honesty always the best policy in a relationship?",
    "Can you truly be friends with an ex-partner?",
    "What's the most important quality in a life partner?",
    "How do you know when to walk away from a toxic relationship?",
    "Is it possible to love two people equally at the same time?",
    "What's the difference between love and attachment?",
    "Should couples share all their finances or keep them separate?",
    "How do you rebuild trust once it's been broken?",
    "Is jealousy ever a healthy emotion?",
    "What role should family play in your major life decisions?",
    "Can long-distance relationships really work long-term?",
  ],
  career: [
    "Is it better to be a specialist or a generalist today?",
    "Would you rather have a job you love that pays little, or one you hate that pays well?",
    "At what point does ambition become unhealthy?",
    "Should everyone experience unemployment at least once?",
    "Is a four-day work week realistic for most industries?",
    "What matters more in hiring — experience or potential?",
    "How do you balance career growth with personal life?",
    "Is failure an essential part of professional success?",
    "Should leaders be chosen for charisma or competence?",
    "When is it time to leave a stable job for an uncertain one?",
    "Does the traditional resume still matter in 2025?",
    "What's the single most underrated career skill?",
  ],
  creative: [
    "If you wrote a book, what would it be about?",
    "Describe your perfect day as if it were a film scene.",
    "What color would you invent, and what would you call it?",
    "If your life had a soundtrack, what song plays during the opening credits?",
    "Design a brand-new holiday — what does it celebrate?",
    "What object in your home tells the best story?",
    "Invent a new word and explain what it means.",
    "What would the museum of your life exhibit?",
    "If you could redesign one city, what would you change?",
    "What's a story you've always wanted to tell but never have?",
    "Create a superpower no one has thought of before.",
    "What would your autobiography's first sentence be?",
  ],
  ethics: [
    "Is it ever acceptable to lie to protect someone's feelings?",
    "Should wealthy nations open their borders completely?",
    "Is it moral to eat animals if lab-grown meat is available?",
    "Should parents have the right to choose their child's genes?",
    "Is censorship ever justified to protect society?",
    "Should voting be mandatory in democratic countries?",
    "Is it ethical to use AI to create art and sell it?",
    "Should there be a maximum wealth limit?",
    "Is pacifism always the morally correct stance?",
    "Should people be required to pass a test before having children?",
    "Is it wrong to pirate media you can't afford?",
    "Should billionaires exist?",
  ],
  culture: [
    "What's a tradition from another culture you wish your country adopted?",
    "If you could live anywhere in the world for a year, where would it be?",
    "What food best represents your hometown?",
    "How does travel change a person?",
    "What's a stereotype about your culture that's completely wrong?",
    "Which language sounds the most beautiful to you?",
    "What's the most underrated travel destination?",
    "How important is preserving local traditions in a globalized world?",
    "What festival anywhere in the world would you most like to attend?",
    "Does your hometown shape who you become?",
    "What's a dish you grew up with that everyone should try?",
    "How does the place you live affect your worldview?",
  ],
};

// Flatten into Topic objects with stable ids.
export const PREBUILT_TOPICS: Topic[] = (
  Object.keys(RAW_TOPICS) as CategoryId[]
).flatMap((category) =>
  RAW_TOPICS[category].map((text, i) => ({
    id: `prebuilt-${category}-${i}`,
    text,
    category,
    source: "prebuilt" as const,
  })),
);

export const PREBUILT_COUNT = PREBUILT_TOPICS.length;

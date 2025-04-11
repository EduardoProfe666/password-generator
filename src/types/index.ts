export interface PasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  wordCount: number;
  wordSeparator: string;
  wordLanguage: "en" | "es";
}

export interface CrackTimesSeconds {
  offline_fast_hashing_1e10_per_second: number;
  offline_slow_hashing_1e4_per_second: number;
  online_no_throttling_10_per_second: number;
  online_throttling_100_per_hour: number;
}

export interface PasswordStrength {
  score: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimesSeconds: CrackTimesSeconds;
  pattern?: string;
  sequence?: string[];
}

export interface PasswordStrengthState extends PasswordStrength {
  entropy: number;
  crackTime: string;
}

export interface BruteForceSimulation {
  method: "sequential" | "dictionary" | "hybrid";
  isRunning: boolean;
  progress: number;
  hardware:
    | "cpu_basic"
    | "cpu_multi"
    | "gpu_gaming"
    | "gpu_mining"
    | "cluster_small"
    | "cluster_large";
}

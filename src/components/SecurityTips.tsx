import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Shield,
  Key,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Brain,
  RefreshCw,
  History,
  Fingerprint,
  Smartphone,
} from "lucide-react";

interface Tip {
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: {
    good?: string[];
    bad?: string[];
  };
  additionalInfo?: string;
}

const securityTips: Tip[] = [
  {
    title: "Length Matters",
    description:
      "Length is the most important factor in password security. A long but memorable password is more secure than a short complex one.",
    icon: <Key className="w-5 h-5 text-green-500" />,
    examples: {
      good: ["my.dog.barks.3.times.a.day!", "TheRainInSpainFalls2024"],
      bad: ["Abc123!", "Pass2024"],
    },
    additionalInfo:
      "A password of 16 characters or more is practically impossible to crack by brute force with current technology.",
  },
  {
    title: "Memorable Patterns",
    description:
      "Create long and memorable passwords using phrases or patterns that make sense to you but are hard for others to guess.",
    icon: <Brain className="w-5 h-5 text-blue-500" />,
    examples: {
      good: [
        "The.coffee.with.milk.is.very.good!2024",
        "I.Travel.to.Paris.every.Summer*24",
      ],
      bad: ["qwerty123", "123456789"],
    },
    additionalInfo:
      "Complete phrases with spaces or dots are easier to remember and more secure than single words with special characters.",
  },
  {
    title: "Character Mix",
    description:
      "Combine uppercase, lowercase, numbers, and special characters naturally within a phrase or pattern you can remember.",
    icon: <Lock className="w-5 h-5 text-purple-500" />,
    examples: {
      good: ["My.Cat*Sleeps_15.Hours!", "I.Have.2.Dogs&3.Cats*2024"],
      bad: ["password123", "administrator"],
    },
    additionalInfo:
      "Special characters are more effective when used naturally in a phrase, not just at the end.",
  },
  {
    title: "Avoid Personal Info",
    description:
      "Never use information that can be found on your social media or that someone close to you could guess.",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    examples: {
      bad: ["NewYork1992", "John123!", "Rover2018"],
    },
    additionalInfo:
      "Hackers can find your birth date, pet names, or hometown on social media.",
  },
  {
    title: "Unique Passwords",
    description:
      "Use a different password for each service. If one is compromised, the others will remain secure.",
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    examples: {
      good: ["Netflix: Watch.3.Shows*Per.Week", "Gmail: Send.5.Emails*Daily"],
      bad: ["Using the same password everywhere"],
    },
    additionalInfo:
      "A password manager will help you maintain unique and secure passwords for each service.",
  },
  {
    title: "Regular Updates",
    description:
      "Change your passwords regularly, especially after any known security breach.",
    icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
    examples: {
      good: ["Change critical passwords every 3-6 months"],
      bad: ["Keeping the same password for years"],
    },
    additionalInfo:
      'Use services like "Have I Been Pwned" to check if your credentials have been compromised.',
  },
  {
    title: "Two-Factor Authentication",
    description:
      "Enable two-factor authentication (2FA) whenever possible, as a complement to your password.",
    icon: <Smartphone className="w-5 h-5 text-rose-500" />,
    examples: {
      good: ["Using an authenticator app", "SMS verification as backup"],
    },
    additionalInfo:
      "2FA adds an extra layer of security even if someone knows your password.",
  },
  {
    title: "Password History",
    description:
      "Don't reuse old passwords and avoid predictable patterns when changing them.",
    icon: <History className="w-5 h-5 text-amber-500" />,
    examples: {
      bad: ["Password2023", "Password2024"],
    },
    additionalInfo:
      "Attackers can predict new passwords if they follow obvious patterns from previous ones.",
  },
  {
    title: "Biometric Security",
    description:
      "Use biometrics as a complement, not as a replacement for strong passwords.",
    icon: <Fingerprint className="w-5 h-5 text-cyan-500" />,
    examples: {
      good: ["Fingerprint + strong password"],
      bad: ["Only fingerprint without backup"],
    },
    additionalInfo:
      "Biometrics can be compromised and cannot be changed like a password.",
  },
];

export default function SecurityTips() {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800"
    >
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Password Security Guide
        </h2>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Why is it important?
        </h3>
        <p className="text-blue-700 dark:text-blue-200">
          Passwords are your first line of defense against unauthorized access.
          A weak password can compromise your digital identity, personal data,
          and financial resources. Follow these tips to create and maintain
          secure passwords.
        </p>
      </div>

      <div className="space-y-4">
        {securityTips.map((tip, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedTip(expandedTip === index ? null : index)
              }
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {tip.icon}
                <span className="font-medium text-gray-900 dark:text-white">
                  {tip.title}
                </span>
              </div>
              {expandedTip === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <AnimatePresence>
              {expandedTip === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {tip.description}
                    </p>
                    {tip.examples.good && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Recommended Examples:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {tip.examples.good.map((example, i) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tip.examples.bad && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          What to Avoid:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {tip.examples.bad.map((example, i) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tip.additionalInfo && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          💡 {tip.additionalInfo}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
          Pro Tip
        </h3>
        <p className="text-indigo-700 dark:text-indigo-200">
          Use a trusted password manager to generate and securely store unique,
          complex passwords for all your accounts. You only need to remember one
          master password while maintaining maximum security across all your
          services. Popular options include Bitwarden (open source), 1Password,
          or LastPass.
        </p>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Copy,
  Download,
  AlertTriangle,
  List,
  Trash,
  Check,
  Sparkles,
  History,
  Activity,
  Calendar,
  Tag,
  Star,
  Search,
  Tags,
  Upload,
  Save,
  X,
  Filter,
} from "lucide-react";
import type { PasswordOptions } from "../types";
import {
  generatePassword,
  generateWordBasedPassword,
  calculatePasswordEntropy,
} from "../utils/passwordUtils";
import zxcvbn from "zxcvbn";

interface StrengthIndicatorProps {
  score: number;
  entropy: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimesSeconds: {
    offline_fast_hashing_1e10_per_second: number;
    offline_slow_hashing_1e4_per_second: number;
    online_no_throttling_10_per_second: number;
    online_throttling_100_per_hour: number;
  };
  pattern?: string;
  sequence?: string[];
}

interface PasswordHistory {
  password: string;
  timestamp: number;
  strength: number;
  type: "random" | "words";
  tags: string[];
  favorite?: boolean;
}

interface TagWithCount {
  name: string;
  count: number;
  color: string;
}

interface TagCategory {
  name: string;
  color: string;
  tags: string[];
}

const MAX_HISTORY = 10;

const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
];

const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  {
    name: "Strength",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    tags: ["very-strong", "strong", "medium", "weak"],
  },
  {
    name: "Purpose",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    tags: ["work", "personal", "finance", "social"],
  },
  {
    name: "Type",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    tags: ["memorable", "random", "phrase", "pincode"],
  },
];

const getTagColor = (tag: string): string => {
  const hash = tag.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
};

const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({
  score,
  entropy,
  feedback,
  crackTimesSeconds,
  pattern,
  sequence,
}) => {
  const colors: Record<number, string> = {
    0: "bg-red-500",
    1: "bg-orange-500",
    2: "bg-yellow-500",
    3: "bg-green-500",
    4: "bg-emerald-500",
  };

  const labels: Record<number, string> = {
    0: "Very Weak",
    1: "Weak",
    2: "Fair",
    3: "Strong",
    4: "Very Strong",
  };

  const scenarios = {
    online_throttling_100_per_hour: "Online attack (throttled)",
    online_no_throttling_10_per_second: "Online attack (un-throttled)",
    offline_slow_hashing_1e4_per_second: "Offline attack (slow hash)",
    offline_fast_hashing_1e10_per_second: "Offline attack (fast hash)",
  } as const;

  const formatCrackTime = (seconds: number): string => {
    if (seconds < 1) return "instantly";
    if (seconds < 60) return `${Math.round(seconds).toLocaleString()} seconds`;
    if (seconds < 3600)
      return `${Math.round(seconds / 60).toLocaleString()} minutes`;
    if (seconds < 86400)
      return `${Math.round(seconds / 3600).toLocaleString()} hours`;
    if (seconds < 2592000)
      return `${Math.round(seconds / 86400).toLocaleString()} days`;
    if (seconds < 31536000)
      return `${Math.round(seconds / 2592000).toLocaleString()} months`;
    return `${Math.round(seconds / 31536000).toLocaleString()} years`;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">Strength:</span>
          <span
            className={`font-medium ${colors[score].replace("bg-", "text-")}`}
          >
            {labels[score]}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
          <div
            className={`h-full ${colors[score]} transition-all duration-300`}
            style={{ width: `${(score + 1) * 20}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm text-indigo-700 dark:text-indigo-300">
          Password Entropy: {entropy} bits
        </span>
        <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
          (
          {entropy < 50
            ? "Low"
            : entropy < 75
            ? "Medium"
            : entropy < 100
            ? "High"
            : "Very High"}
          )
        </span>
      </div>

      {feedback.warning && (
        <div className="flex items-start gap-2 text-orange-600 dark:text-orange-400 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{feedback.warning}</span>
        </div>
      )}

      {feedback.suggestions.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Suggestions:
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Crack Time Estimates:
        </h4>
        <div className="space-y-2">
          {(
            Object.entries(scenarios) as [
              keyof typeof crackTimesSeconds,
              string
            ][]
          ).map(([key, label]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{label}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCrackTime(crackTimesSeconds[key])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {pattern && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Pattern detected: </span>
          {pattern}
        </div>
      )}

      {sequence && sequence.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Password Structure:
          </h4>
          <div className="space-y-1">
            {sequence.map((part, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Part {index + 1}: {part}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PasswordHistoryList: React.FC<{
  history: PasswordHistory[];
  onSelect: (password: string) => void;
  onClear: () => void;
  setPasswordHistory: (
    history:
      | PasswordHistory[]
      | ((prev: PasswordHistory[]) => PasswordHistory[])
  ) => void;
  savePasswordHistory: (history: PasswordHistory[]) => void;
}> = ({
  history,
  onSelect,
  onClear,
  setPasswordHistory,
  savePasswordHistory,
}) => {
  const [filterStrength, setFilterStrength] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<"all" | "random" | "words">(
    "all"
  );
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "strength">("date");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedPassword, setSelectedPassword] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");
  const [tagCategories, setTagCategories] = useState<TagCategory[]>(
    DEFAULT_TAG_CATEGORIES
  );
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: TAG_COLORS[0],
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const tags: TagWithCount[] = useMemo(() => {
    const tagCounts = new Map<string, number>();
    history.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries()).map(([name, count]) => ({
      name,
      count,
      color: getTagColor(name),
    }));
  }, [history]);

  const suggestTags = useCallback(
    (password: string): string[] => {
      const suggestions: string[] = [];
      const strength = zxcvbn(password).score;

      suggestions.push(
        strength >= 4
          ? "very-strong"
          : strength >= 3
          ? "strong"
          : strength >= 2
          ? "medium"
          : "weak"
      );

      if (/[A-Z]/.test(password)) suggestions.push("uppercase");
      if (/[0-9]/.test(password)) suggestions.push("numbers");
      if (/[^a-zA-Z0-9]/.test(password)) suggestions.push("special-chars");
      if (password.includes(" ")) suggestions.push("phrase");
      if (/^\d+$/.test(password)) suggestions.push("numeric");
      if (password.length >= 16) suggestions.push("long");

      return suggestions.filter((tag) =>
        tagCategories.some((cat) => cat.tags.includes(tag))
      );
    },
    [tagCategories]
  );

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      if (filterStrength !== null && entry.strength !== filterStrength)
        return false;
      if (filterType !== "all" && entry.type !== filterType) return false;
      if (filterTags.length > 0) {
        if (filterMode === "AND") {
          if (!filterTags.every((tag) => entry.tags?.includes(tag)))
            return false;
        } else {
          if (!filterTags.some((tag) => entry.tags?.includes(tag)))
            return false;
        }
      }
      if (
        searchTerm &&
        !entry.password.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [history, filterStrength, filterType, filterTags, filterMode, searchTerm]);

  const toggleFavorite = (password: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(password)) {
      newFavorites.delete(password);
    } else {
      newFavorites.add(password);
    }
    setFavorites(newFavorites);
    localStorage.setItem(
      "passwordFavorites",
      JSON.stringify(Array.from(newFavorites))
    );
  };

  const handleAddTag = (password: string) => {
    if (!newTag.trim()) return;

    setPasswordHistory((prev) =>
      prev.map((entry) =>
        entry.password === password
          ? { ...entry, tags: [...(entry.tags || []), newTag.trim()] }
          : entry
      )
    );

    setNewTag("");
    setIsAddingTag(false);
    savePasswordHistory(history);
  };

  const handleRemoveTag = (password: string, tagToRemove: string) => {
    setPasswordHistory((prev) =>
      prev.map((entry) =>
        entry.password === password
          ? {
              ...entry,
              tags: entry.tags?.filter((tag) => tag !== tagToRemove) || [],
            }
          : entry
      )
    );
    savePasswordHistory(history);
  };

  const handleExportHistory = () => {
    const exportData = {
      version: 1,
      passwords: history,
      favorites: Array.from(favorites),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "password-history.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.version === 1) {
          setPasswordHistory(importData.passwords);
          setFavorites(new Set(importData.favorites));
          savePasswordHistory(importData.passwords);
          localStorage.setItem(
            "passwordFavorites",
            JSON.stringify(importData.favorites)
          );
        }
      } catch (error) {
        console.error("Failed to import history:", error);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const savedFavorites = localStorage.getItem("passwordFavorites");
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error("Failed to load password favorites:", e);
      }
    }
  }, []);

  const renderTagModal = () => {
    if (!isManagingTags) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage Tags
            </h3>
            <button
              onClick={() => setIsManagingTags(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </h4>
                <div className="space-y-2">
                  {tagCategories.map((category, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full p-2 text-left rounded-lg dark:text-white ${
                        selectedCategory === category.name
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags in Category
                </h4>
                {selectedCategory && (
                  <div className="flex flex-wrap gap-2">
                    {tagCategories
                      .find((cat) => cat.name === selectedCategory)
                      ?.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${
                            tagCategories.find(
                              (cat) => cat.name === selectedCategory
                            )?.color
                          }`}
                        >
                          {tag}
                          <button
                            onClick={() => {
                              setTagCategories((prev) =>
                                prev.map((cat) =>
                                  cat.name === selectedCategory
                                    ? {
                                        ...cat,
                                        tags: cat.tags.filter((t) => t !== tag),
                                      }
                                    : cat
                                )
                              );
                            }}
                            className="hover:text-red-500 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add New Category
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="New category name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                  value={newCategory.color}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {TAG_COLORS.map((color, idx) => (
                    <option key={idx} value={color}>
                      Color {idx + 1}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (newCategory.name) {
                      setTagCategories((prev) => [
                        ...prev,
                        { ...newCategory, tags: [] },
                      ]);
                      setNewCategory({ name: "", color: TAG_COLORS[0] });
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (history.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Password History
          </h3>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="import-history"
            className="hidden"
            accept=".json"
            onChange={handleImportHistory}
          />
          <label
            htmlFor="import-history"
            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Upload className="w-4 h-4" />
            Import
          </label>
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Save className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onClear}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Clear history"
          >
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "all" | "random" | "words")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="random">Random</option>
              <option value="words">Word-based</option>
            </select>

            <select
              value={filterStrength === null ? "all" : filterStrength}
              onChange={(e) =>
                setFilterStrength(
                  e.target.value === "all" ? null : Number(e.target.value)
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Strengths</option>
              <option value="4">Very Strong</option>
              <option value="3">Strong</option>
              <option value="2">Fair</option>
              <option value="1">Weak</option>
              <option value="0">Very Weak</option>
            </select>

            <button
              onClick={() =>
                setSortBy((current) =>
                  current === "date" ? "strength" : "date"
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 light:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              title={`Sort by ${sortBy === "date" ? "strength" : "date"}`}
            >
              {sortBy === "date" ? (
                <Calendar className="w-5 h-5" />
              ) : (
                <Tag className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() =>
                setFilterMode((mode) => (mode === "AND" ? "OR" : "AND"))
              }
              className={`px-3 py-2 border border-gray-300 rounded-lg dark:text-white flex items-center gap-2 ${
                filterTags.length > 1
                  ? "bg-indigo-50 dark:bg-indigo-900/20"
                  : "opacity-50 cursor-not-allowed"
              }`}
              disabled={filterTags.length <= 1}
              title={`Filter Mode: ${filterMode}`}
            >
              <Filter className="w-4 h-4 dark:text-white" />
              <span className="text-xs font-medium">{filterMode}</span>
            </button>

            <button
              onClick={() => setIsManagingTags(true)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              title="Manage tags"
            >
              <Tags className="w-4 h-4 dark:text-white" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {tagCategories.map((category, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => {
                  const tagCount = tags.find((t) => t.name === tag)?.count || 0;
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setFilterTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${
                        category.color
                      } ${
                        filterTags.includes(tag)
                          ? "ring-2 ring-offset-2 ring-indigo-500"
                          : tagCount === 0
                          ? "opacity-50"
                          : ""
                      }`}
                      disabled={tagCount === 0}
                    >
                      {tag}
                      {tagCount > 0 && (
                        <span className="text-xs opacity-75">({tagCount})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredHistory.map((entry, index) => (
          <div
            key={index}
            className="flex flex-col p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    entry.strength >= 3
                      ? "bg-green-500"
                      : entry.strength >= 2
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                  {entry.password}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => toggleFavorite(entry.password)}
                  className={`text-gray-400 hover:text-yellow-500 ${
                    favorites.has(entry.password) ? "text-yellow-500" : ""
                  }`}
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedPassword(entry.password);
                    setIsAddingTag(true);
                  }}
                  className="text-gray-400 hover:text-indigo-500"
                  title="Add tag"
                >
                  <Tags className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelect(entry.password)}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getTagColor(
                      tag
                    )}`}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(entry.password, tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {renderTagModal()}

      {isAddingTag && selectedPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add Tags
            </h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestTags(selectedPassword).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setNewTag(tag);
                      handleAddTag(selectedPassword);
                    }}
                    className={`px-2 py-1 rounded-full text-sm ${
                      tagCategories.find((cat) => cat.tags.includes(tag))
                        ?.color || TAG_COLORS[0]
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => handleAddTag(selectedPassword)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingTag(false);
                  setNewTag("");
                  setSelectedPassword(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistory[]>([]);
  const [generationMode, setGenerationMode] = useState<"random" | "words">(
    "random"
  );
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    wordCount: 4,
    wordSeparator: "-",
    wordLanguage: "en",
  });

  const [strength, setStrength] = useState<{
    score: number;
    entropy: number;
    feedback: {
      warning: string;
      suggestions: string[];
    };
    crackTime: string;
    pattern: string;
    crackTimesSeconds: Record<
      | "offline_fast_hashing_1e10_per_second"
      | "offline_slow_hashing_1e4_per_second"
      | "online_no_throttling_10_per_second"
      | "online_throttling_100_per_hour",
      number
    >;
    sequence: string[];
  }>({
    score: 0,
    entropy: 0,
    feedback: {
      warning: "",
      suggestions: [],
    },
    crackTime: "",
    pattern: "",
    crackTimesSeconds: {
      offline_fast_hashing_1e10_per_second: 0,
      offline_slow_hashing_1e4_per_second: 0,
      online_no_throttling_10_per_second: 0,
      online_throttling_100_per_hour: 0,
    },
    sequence: [],
  });

  const [copyFeedback, setCopyFeedback] = useState(false);

  const formatCrackTime = (seconds: number): string => {
    if (seconds < 1) return "instantly";
    if (seconds < 60) return `${Math.round(seconds).toLocaleString()} seconds`;
    if (seconds < 3600)
      return `${Math.round(seconds / 60).toLocaleString()} minutes`;
    if (seconds < 86400)
      return `${Math.round(seconds / 3600).toLocaleString()} hours`;
    if (seconds < 2592000)
      return `${Math.round(seconds / 86400).toLocaleString()} days`;
    if (seconds < 31536000)
      return `${Math.round(seconds / 2592000).toLocaleString()} months`;
    return `${Math.round(seconds / 31536000).toLocaleString()} years`;
  };

  const analyzePassword = useCallback((pwd: string) => {
    if (!pwd) {
      setStrength({
        score: 0,
        entropy: 0,
        feedback: {
          warning: "",
          suggestions: [],
        },
        crackTime: "",
        pattern: "",
        crackTimesSeconds: {
          offline_fast_hashing_1e10_per_second: 0,
          offline_slow_hashing_1e4_per_second: 0,
          online_no_throttling_10_per_second: 0,
          online_throttling_100_per_hour: 0,
        },
        sequence: [],
      });
      return;
    }

    const result = zxcvbn(pwd);
    const entropy = calculatePasswordEntropy(pwd);

    const crackTimesSeconds = {
      offline_fast_hashing_1e10_per_second: Number(
        result.crack_times_seconds.offline_fast_hashing_1e10_per_second
      ),
      offline_slow_hashing_1e4_per_second: Number(
        result.crack_times_seconds.offline_slow_hashing_1e4_per_second
      ),
      online_no_throttling_10_per_second: Number(
        result.crack_times_seconds.online_no_throttling_10_per_second
      ),
      online_throttling_100_per_hour: Number(
        result.crack_times_seconds.online_throttling_100_per_hour
      ),
    };

    setStrength({
      score: result.score,
      entropy,
      feedback: {
        warning: result.feedback.warning || "",
        suggestions: result.feedback.suggestions || [],
      },
      crackTime: formatCrackTime(
        Number(crackTimesSeconds.online_no_throttling_10_per_second)
      ),
      pattern: result.sequence?.[0]?.pattern || "",
      crackTimesSeconds,
      sequence: result.sequence?.map((s) => `${s.pattern} (${s.token})`) || [],
    });
  }, []);

  useEffect(() => {
    analyzePassword(password);
  }, [password, analyzePassword]);

  const handleGeneratePassword = () => {
    const newPassword =
      generationMode === "random"
        ? generatePassword(options)
        : generateWordBasedPassword({
            ...options,
            wordLanguage: options.wordLanguage,
          });

    setPassword(newPassword);

    setPasswordHistory((prev) => {
      const newHistory = [
        {
          password: newPassword,
          timestamp: Date.now(),
          strength: zxcvbn(newPassword).score,
          type: generationMode,
          tags: [],
        },
        ...prev,
      ].slice(0, MAX_HISTORY);

      savePasswordHistory(newHistory);
      return newHistory;
    });
  };

  const handleGenerateBulkPasswords = () => {
    const passwords = Array.from({ length: bulkCount }, () =>
      generationMode === "random"
        ? generatePassword(options)
        : generateWordBasedPassword({
            ...options,
            wordLanguage: options.wordLanguage,
          })
    );
    setBulkPasswords(passwords);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleCopyBulkPasswords = async () => {
    const text = bulkPasswords.join("\n");
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownloadBulkPasswords = () => {
    const text = bulkPasswords.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setPasswordHistory([]);
    localStorage.removeItem("passwordHistory");
  };

  const savePasswordHistory = (history: PasswordHistory[]) => {
    localStorage.setItem("passwordHistory", JSON.stringify(history));
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("passwordHistory");
    if (savedHistory) {
      try {
        setPasswordHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load password history:", e);
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800"
    >
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Password Generator
        </h2>
      </div>

      <div className="relative mb-6">
        <div className="relative">
          <input
            type={"text"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-24 text-lg bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
            placeholder="Generated password will appear here"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <AnimatePresence>
              {copyFeedback ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="p-2 text-green-600 dark:text-green-400"
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleCopyPassword}
                  className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={handleGeneratePassword}
              className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              title="Generate new password"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {password && (
        <StrengthIndicator
          score={strength.score}
          entropy={strength.entropy}
          feedback={strength.feedback}
          crackTimesSeconds={strength.crackTimesSeconds}
          pattern={strength.pattern}
          sequence={strength.sequence}
        />
      )}

      <div className="space-y-6 mt-6">
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <button
            onClick={() => setGenerationMode("random")}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              generationMode === "random"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Random Characters
          </button>
          <button
            onClick={() => setGenerationMode("words")}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              generationMode === "words"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Word-based
          </button>
        </div>

        {generationMode === "random" ? (
          <>
            <div>
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Password Length: {options.length.toLocaleString()}
                </span>
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) =>
                  setOptions({ ...options, length: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeUppercase: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Uppercase Letters
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeLowercase: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Lowercase Letters
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) =>
                    setOptions({ ...options, includeNumbers: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Numbers
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) =>
                    setOptions({ ...options, includeSymbols: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Special Characters
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      excludeAmbiguous: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Exclude Ambiguous Characters
                </span>
              </label>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOptions({ ...options, wordLanguage: "en" })}
                  className={`px-4 py-2 rounded-lg ${
                    options.wordLanguage === "en"
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setOptions({ ...options, wordLanguage: "es" })}
                  className={`px-4 py-2 rounded-lg ${
                    options.wordLanguage === "es"
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Number of Words: {options.wordCount.toLocaleString()}
                </span>
              </label>
              <input
                type="range"
                min="3"
                max="8"
                value={options.wordCount}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    wordCount: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Word Separator
              </label>
              <div className="flex gap-2">
                {["-", "_", ".", " ", "#"].map((separator) => (
                  <button
                    key={separator}
                    onClick={() =>
                      setOptions({ ...options, wordSeparator: separator })
                    }
                    className={`px-4 py-2 rounded-lg ${
                      options.wordSeparator === separator
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {separator === " " ? "(space)" : separator}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) =>
                  setOptions({ ...options, includeNumbers: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Add Random Number
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <List className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bulk Generation
            </h3>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-gray-300">
                Number of passwords:
              </span>
              <input
                type="number"
                min="10"
                max="100"
                value={bulkCount}
                onChange={(e) =>
                  setBulkCount(
                    Math.min(100, Math.max(10, parseInt(e.target.value) || 10))
                  )
                }
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </label>
            <button
              onClick={handleGenerateBulkPasswords}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Generate
            </button>
          </div>

          {bulkPasswords.length > 0 && (
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {bulkPasswords.map((pwd, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-600 dark:text-gray-400"
                  >
                    {pwd}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyBulkPasswords}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button
                  onClick={handleDownloadBulkPasswords}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setBulkPasswords([])}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PasswordHistoryList
        history={passwordHistory}
        onSelect={setPassword}
        onClear={handleClearHistory}
        setPasswordHistory={setPasswordHistory}
        savePasswordHistory={savePasswordHistory}
      />
    </motion.div>
  );
}

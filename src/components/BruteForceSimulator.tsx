import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Hash,
  Settings,
  Shield,
  Zap,
  Cpu,
  Battery,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import type { BruteForceSimulation } from "../types";

interface SimulationStats {
  attempts: number;
  timeElapsed: number;
  remainingCombinations: number;
  successRate: number;
  estimatedTimeToComplete: number;
  energyCost: number;
  passwordsPerWatt: number;
}

interface AttackMethod {
  id: "sequential" | "dictionary" | "hybrid";
  name: string;
  description: string;
  icon: React.ReactNode;
  baseSpeed: number;
  successRate: number;
  complexityMultiplier: number;
}

const HARDWARE_PROFILES = {
  cpu_basic: {
    name: "CPU Basic",
    icon: <Cpu className="w-5 h-5" />,
    baseSpeed: 500_000, // 500K hashes/s
    powerCost: 0.065, // kW/h
    description: "Basic CPU (2 cores)",
    specs: "2 cores @ 2.4GHz, 4GB RAM",
  },
  cpu_multi: {
    name: "CPU Multi-Core",
    icon: <Cpu className="w-5 h-5" />,
    baseSpeed: 2_000_000, // 2M hashes/s
    powerCost: 0.125, // kW/h
    description: "High-end CPU (8 cores)",
    specs: "8 cores @ 3.8GHz, 16GB RAM",
  },
  gpu_gaming: {
    name: "Gaming GPU",
    icon: <Zap className="w-5 h-5" />,
    baseSpeed: 100_000_000, // 100M hashes/s
    powerCost: 0.25, // kW/h
    description: "Gaming graphics card",
    specs: "8GB VRAM, 2560 cores",
  },
  gpu_mining: {
    name: "Mining GPU",
    icon: <Zap className="w-5 h-5" />,
    baseSpeed: 500_000_000, // 500M hashes/s
    powerCost: 0.3, // kW/h
    description: "Specialized mining GPU",
    specs: "16GB HBM2, 4096 cores",
  },
  cluster_small: {
    name: "Small Cluster",
    icon: <Battery className="w-5 h-5" />,
    baseSpeed: 2_000_000_000, // 2B hashes/s
    powerCost: 0.8, // kW/h
    description: "Small compute cluster",
    specs: "10 nodes, 80 cores total",
  },
  cluster_large: {
    name: "Large Cluster",
    icon: <Battery className="w-5 h-5" />,
    baseSpeed: 10_000_000_000, // 10B hashes/s
    powerCost: 2.5, // kW/h
    description: "Large compute cluster",
    specs: "100 nodes, 800 cores total",
  },
};

const ATTACK_METHODS: AttackMethod[] = [
  {
    id: "sequential",
    name: "Brute Force Attack",
    description:
      "Tests every possible combination systematically. Most thorough but slowest method.",
    icon: <Hash className="w-5 h-5" />,
    baseSpeed: 1,
    successRate: 1, // Will eventually find it
    complexityMultiplier: 1,
  },
  {
    id: "dictionary",
    name: "Dictionary Attack",
    description:
      "Uses common passwords and words. Very fast but limited coverage.",
    icon: <Shield className="w-5 h-5" />,
    baseSpeed: 100,
    successRate: 0.15, // 15% chance of finding common passwords
    complexityMultiplier: 0.1,
  },
  {
    id: "hybrid",
    name: "Hybrid Attack",
    description:
      "Combines dictionary with mutations. Good balance of speed and coverage.",
    icon: <Zap className="w-5 h-5" />,
    baseSpeed: 10,
    successRate: 0.45, // 45% chance for semi-complex passwords
    complexityMultiplier: 0.5,
  },
];

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  const years = seconds / 31536000;
  if (years < 100) return `${Math.round(years)} years`;
  if (years < 1000) return `${Math.round(years)} centuries`;
  return `${(years / 1000).toFixed(1)}k years`;
};

const calculatePasswordSpace = (
  length: number,
  charset: number,
  method: AttackMethod
): number => {
  const baseSpace = Math.pow(charset, length);
  return Math.ceil(baseSpace * method.complexityMultiplier);
};

const calculateHashingSpeed = (
  baseSpeed: number,
  hardware: keyof typeof HARDWARE_PROFILES,
  passwordLength: number
): number => {
  const lengthPenalty = Math.max(1, Math.log2(passwordLength));
  return Math.floor(HARDWARE_PROFILES[hardware].baseSpeed / lengthPenalty);
};

const calculateEnergyCost = (
  timeInHours: number,
  hardware: keyof typeof HARDWARE_PROFILES
): number => {
  return timeInHours * HARDWARE_PROFILES[hardware].powerCost;
};

export default function BruteForceSimulator() {
  const [simulation, setSimulation] = useState<BruteForceSimulation>({
    method: "sequential",
    isRunning: false,
    progress: 0,
    hardware: "cpu_basic",
  });

  const [stats, setStats] = useState<SimulationStats>({
    attempts: 0,
    timeElapsed: 0,
    remainingCombinations: 1000000,
    successRate: 0,
    estimatedTimeToComplete: 0,
    energyCost: 0,
    passwordsPerWatt: 0,
  });

  const [password, setPassword] = useState({
    length: 8,
    charset: 26, // Default: lowercase letters only
  });

  const animationFrameRef = useRef<number>();
  const [graphData, setGraphData] = useState<
    Array<{
      time: number;
      attempts: number;
      energyUsage: number;
      efficiency: number;
      progress: number;
    }>
  >([]);

  useEffect(() => {
    if (simulation.isRunning) {
      const startTime = Date.now() - stats.timeElapsed * 1000;
      const attackMethod = ATTACK_METHODS.find(
        (m) => m.id === simulation.method
      )!;
      const totalSpace = calculatePasswordSpace(
        password.length,
        password.charset,
        attackMethod
      );
      const hashingSpeed = calculateHashingSpeed(
        HARDWARE_PROFILES[simulation.hardware].baseSpeed,
        simulation.hardware,
        password.length
      );

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = (currentTime - startTime) / 1000;
        const elapsedHours = elapsed / 3600;

        const baseAttempts = Math.floor(
          elapsed * hashingSpeed * attackMethod.baseSpeed
        );
        const attempts = Math.min(baseAttempts, totalSpace);
        const progress = (attempts / totalSpace) * 100;

        const energyCost = calculateEnergyCost(
          elapsedHours,
          simulation.hardware
        );
        const passwordsPerWatt = attempts / (energyCost * 1000);

        setGraphData((prev) => {
          const newData = [
            ...prev,
            {
              time: elapsed,
              attempts: hashingSpeed,
              energyUsage: energyCost,
              efficiency: passwordsPerWatt,
              progress,
            },
          ];

          if (newData.length > 30) {
            return newData.slice(-30);
          }
          return newData;
        });

        setStats({
          attempts,
          timeElapsed: elapsed,
          remainingCombinations: totalSpace - attempts,
          successRate: attackMethod.successRate,
          estimatedTimeToComplete:
            totalSpace / (hashingSpeed * attackMethod.baseSpeed),
          energyCost,
          passwordsPerWatt,
        });

        setSimulation((prev) => ({
          ...prev,
          progress: Math.min(progress, 100),
        }));

        if (progress < 100) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setSimulation((prev) => ({ ...prev, isRunning: false }));
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [simulation.isRunning, simulation.method, password, simulation.hardware]);

  const handleStart = () =>
    setSimulation((prev) => ({ ...prev, isRunning: true }));
  const handlePause = () =>
    setSimulation((prev) => ({ ...prev, isRunning: false }));
  const handleReset = () => {
    setSimulation((prev) => ({ ...prev, isRunning: false, progress: 0 }));
    setStats({
      attempts: 0,
      timeElapsed: 0,
      remainingCombinations: calculatePasswordSpace(
        password.length,
        password.charset,
        ATTACK_METHODS[0]
      ),
      successRate: 0,
      estimatedTimeToComplete: 0,
      energyCost: 0,
      passwordsPerWatt: 0,
    });
    setGraphData([]);
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: number;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-300">
            Time:{" "}
            {label?.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            s
          </p>
          {payload.map((entry) => (
            <p
              key={entry.name}
              className="text-gray-700 dark:text-gray-300"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800 mx-auto"
    >
      {/* Header Section */}
      <div className="flex items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center gap-3">
          <Hash className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Brute Force Simulator
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration Section */}
        <div className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-xl space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </h3>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Password Settings
            </h4>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    Password Length: {password.length}
                  </span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={password.length}
                  onChange={(e) =>
                    setPassword((prev) => ({
                      ...prev,
                      length: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={simulation.isRunning}
                />
              </div>
            </div>
          </div>

          {/* Attack Methods */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Attack Method
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ATTACK_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() =>
                    setSimulation((prev) => ({ ...prev, method: method.id }))
                  }
                  disabled={simulation.isRunning}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    simulation.method === method.id
                      ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {method.icon}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {method.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {method.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Selection */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hardware
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(HARDWARE_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() =>
                    setSimulation((prev) => ({
                      ...prev,
                      hardware: key as keyof typeof HARDWARE_PROFILES,
                    }))
                  }
                  disabled={simulation.isRunning}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    simulation.hardware === key
                      ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {profile.icon}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {profile.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {profile.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {profile.specs}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Power: {profile.powerCost} kW/h
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Speed: {(profile.baseSpeed / 1_000_000).toLocaleString()}M
                    h/s
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Section */}
        <div className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5" />
              Execution
            </h3>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={handleStart}
                disabled={simulation.isRunning}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1 sm:flex-initial justify-center"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={handlePause}
                disabled={!simulation.isRunning}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1 sm:flex-initial justify-center"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={handleReset}
                disabled={simulation.isRunning}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1 sm:flex-initial justify-center"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Attempts
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.attempts.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Time Elapsed
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.timeElapsed.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                s
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Success Rate
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(stats.successRate * 100).toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                %
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Estimated Time
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(stats.estimatedTimeToComplete)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Energy Usage
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.energyCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kWh
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <h3 className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Efficiency
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.passwordsPerWatt.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                p/W
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <div className="space-y-3">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </h3>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {simulation.progress.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                <div
                  className="absolute h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${simulation.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Attempts per Second
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      className="dark:opacity-40"
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(value) =>
                        value.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }) + "s"
                      }
                      stroke="#6B7280"
                      className="dark:text-gray-400"
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        (value / 1000000).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }) + "M"
                      }
                      stroke="#6B7280"
                      className="dark:text-gray-400"
                    />
                    <Tooltip content={CustomTooltip} />
                    <Line
                      type="monotone"
                      dataKey="attempts"
                      name="Attempts per Second"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Energy Usage & Progress
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={graphData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      className="dark:opacity-40"
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(value) =>
                        value.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }) + "s"
                      }
                      stroke="#6B7280"
                      className="dark:text-gray-400"
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => value.toFixed(2) + " kWh"}
                      stroke="#6B7280"
                      className="dark:text-gray-400"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value.toFixed(0) + "%"}
                      domain={[0, 100]}
                      stroke="#6B7280"
                      className="dark:text-gray-400"
                    />
                    <Tooltip content={CustomTooltip} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="energyUsage"
                      name="Energy Usage"
                      fill="#ef4444"
                      stroke="#dc2626"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="progress"
                      name="Progress"
                      stroke="#4f46e5"
                      dot={false}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

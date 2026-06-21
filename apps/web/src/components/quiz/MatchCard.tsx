import { motion } from 'framer-motion';

interface MatchCardProps {
  text: string;
  type: 'english' | 'japanese';
  selected: boolean;
  matched: boolean;
  onClick: () => void;
}

export function MatchCard({ text, type, selected, matched, onClick }: MatchCardProps) {
  if (matched) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.8 }}
        className="h-16"
      />
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={selected ? { scale: 1.02 } : { scale: 1 }}
      className={`w-full h-16 px-4 rounded-xl border-2 text-sm font-medium transition-colors cursor-pointer text-left ${
        selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
          : type === 'english'
          ? 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50'
          : 'border-gray-200 bg-slate-50 text-gray-800 hover:border-purple-300 hover:bg-purple-50'
      }`}
    >
      {text}
    </motion.button>
  );
}

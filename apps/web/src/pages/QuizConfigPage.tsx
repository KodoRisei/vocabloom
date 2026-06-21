import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { quizApi } from '../services/quiz.api';
import { learningRecordApi } from '../services/learningRecord.api';
import { useQuizStore } from '../store/quizStore';
import { Button } from '../components/common/Button';

const QUESTION_COUNTS = [5, 10, 20, 50] as const;

export function QuizConfigPage() {
  const [count, setCount] = useState<number>(10);
  const navigate = useNavigate();
  const initSession = useQuizStore((s) => s.initSession);

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => learningRecordApi.getStats(),
  });

  const total = stats?.data?.totalVocabularies ?? 0;

  const mutation = useMutation({
    mutationFn: () => quizApi.createSession(count),
    onSuccess: (res) => {
      const { sessionId, questionCount, activeItems, japaneseOptions, stats } = res.data;
      initSession(sessionId, questionCount, activeItems, japaneseOptions, stats);
      navigate(`/quiz/${sessionId}`);
    },
  });

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">クイズ設定</h1>
      <p className="text-gray-500 mb-8">出題数を選んでスタート（登録単語: {total}件）</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {QUESTION_COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            disabled={total < n}
            className={`rounded-xl border-2 py-6 text-2xl font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              count === n
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
            }`}
          >
            {n}問
          </button>
        ))}
      </div>

      {mutation.isError && (
        <p className="text-red-600 text-sm mb-4">{mutation.error?.message}</p>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || total < count}
      >
        {mutation.isPending ? '準備中...' : 'スタート'}
      </Button>
    </div>
  );
}

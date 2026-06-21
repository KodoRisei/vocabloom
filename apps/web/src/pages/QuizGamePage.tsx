import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { quizApi } from '../services/quiz.api';
import { useQuizStore } from '../store/quizStore';
import { Button } from '../components/common/Button';
import type { JapaneseOption } from '../types';

export function QuizGamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    activeItems,
    japaneseOptions,
    stats,
    selectedEnglishId,
    correctCount,
    incorrectCount,
    lastAnswerCorrect,
    isSubmitting,
    sessionCompleted,
    selectEnglish,
    handleAnswer,
    setSubmitting,
    reset,
  } = useQuizStore();

  const answerMutation = useMutation({
    mutationFn: ({
      vocabularyId,
      selectedVocabularyId,
    }: {
      vocabularyId: string;
      selectedVocabularyId: string;
    }) => quizApi.submitAnswer(sessionId!, vocabularyId, selectedVocabularyId),
    onSuccess: (res) => {
      const { isCorrect, sessionCompleted: done, window } = res.data;
      handleAnswer(isCorrect, window, done);
    },
    onError: () => setSubmitting(false),
  });

  useEffect(() => {
    if (sessionCompleted) {
      navigate(`/quiz/${sessionId}/result`);
    }
  }, [sessionCompleted, sessionId, navigate]);

  const handleJapaneseSelect = useCallback(
    (option: JapaneseOption) => {
      if (!selectedEnglishId || isSubmitting) return;
      setSubmitting(true);
      answerMutation.mutate({
        vocabularyId: selectedEnglishId,
        selectedVocabularyId: option.vocabularyId,
      });
    },
    [selectedEnglishId, isSubmitting, answerMutation, setSubmitting],
  );

  if (!sessionId || !stats) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">セッションが見つかりません</p>
        <Button onClick={() => navigate('/quiz')}>クイズ設定に戻る</Button>
      </div>
    );
  }

  const progressPercent = stats.totalCount > 0
    ? (stats.answeredCount / stats.totalCount) * 100
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">
            進捗 {stats.answeredCount}/{stats.totalCount}
          </p>
          <div className="flex gap-3 text-sm mt-1">
            <span className="text-green-600 font-medium">正解 {correctCount}</span>
            <span className="text-red-500 font-medium">ミス {incorrectCount}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            quizApi.abandonSession(sessionId);
            reset();
            navigate('/quiz');
          }}
        >
          終了
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
        <motion.div
          className="bg-indigo-500 h-2 rounded-full"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {lastAnswerCorrect !== null && (
          <motion.div
            key={String(lastAnswerCorrect) + correctCount}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium text-center ${
              lastAnswerCorrect
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {lastAnswerCorrect ? '✓ 正解！' : '✗ 不正解 — もう一度'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column: English cards */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            英語 ({activeItems.length}問表示中)
          </p>
          <div className="space-y-3">
            <AnimatePresence>
              {activeItems.map((item) => {
                const isSelected = selectedEnglishId === item.vocabularyId;
                return (
                  <motion.button
                    key={item.vocabularyId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => selectEnglish(item.vocabularyId)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    {item.englishExpression}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: Japanese options (correct + decoys mixed) */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            日本語 (正解を選んでください)
          </p>
          <div className="space-y-3">
            {japaneseOptions.map((option) => {
              const isTargetSelected = selectedEnglishId !== null;
              return (
                <motion.button
                  key={option.vocabularyId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleJapaneseSelect(option)}
                  disabled={!isTargetSelected || isSubmitting}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    !isTargetSelected || isSubmitting
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  {option.japaneseTranslation}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instruction hint */}
      {!selectedEnglishId && (
        <p className="text-center text-xs text-gray-400 mt-8">
          左の英語カードを選択してから、右の日本語を選んでください
        </p>
      )}
      {selectedEnglishId && !isSubmitting && (
        <p className="text-center text-xs text-indigo-500 mt-8">
          「{activeItems.find((i) => i.vocabularyId === selectedEnglishId)?.englishExpression}」の日本語訳を選んでください
        </p>
      )}
    </div>
  );
}

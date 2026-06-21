import { Link, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { Button } from '../components/common/Button';

export function QuizResultPage() {
  const { correctCount, incorrectCount, questionCount, reset } = useQuizStore();
  const navigate = useNavigate();
  const total = questionCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const handlePlayAgain = () => {
    reset();
    navigate('/quiz');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">
        {accuracy === 100 ? '🎉' : accuracy >= 70 ? '👏' : '💪'}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">クイズ完了！</h1>
      <p className="text-gray-500 mb-8">お疲れ様でした</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="text-5xl font-bold text-indigo-600 mb-1">{accuracy}%</div>
        <p className="text-sm text-gray-500">正解率</p>
        <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-gray-500">正解</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
            <p className="text-xs text-gray-500">ミス</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-700">{total}</p>
            <p className="text-xs text-gray-500">合計</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button size="lg" onClick={handlePlayAgain}>もう一度</Button>
        <Link to="/">
          <Button size="lg" variant="secondary">ホームへ</Button>
        </Link>
      </div>
    </div>
  );
}

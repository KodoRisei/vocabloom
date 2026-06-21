import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { learningRecordApi } from '../services/learningRecord.api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => learningRecordApi.getStats(),
  });

  const stats = data?.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">VocaBloom</h1>
      <p className="text-gray-500 mb-8">英語フレーズをマッチングで覚えよう</p>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="登録単語数" value={stats?.totalVocabularies ?? 0} />
          <StatCard label="学習済み" value={stats?.learnedVocabularies ?? 0} />
          <StatCard label="完了セッション" value={stats?.completedSessions ?? 0} />
          <StatCard
            label="最高連続正解"
            value={
              stats?.topStreak
                ? `${stats.topStreak.streak}回 (${stats.topStreak.expression})`
                : '-'
            }
          />
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link to="/quiz">
          <Button size="lg">クイズを始める</Button>
        </Link>
        <Link to="/vocabularies">
          <Button size="lg" variant="secondary">単語を管理する</Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

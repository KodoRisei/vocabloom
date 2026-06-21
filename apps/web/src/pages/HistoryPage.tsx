import { useQuery } from '@tanstack/react-query';
import { learningRecordApi } from '../services/learningRecord.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['learning-records'],
    queryFn: () => learningRecordApi.list(),
  });

  const records = (data?.data as any[]) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学習履歴</h1>

      {isLoading ? (
        <LoadingSpinner />
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-16">まだ学習履歴がありません</p>
      ) : (
        <div className="space-y-2">
          {records.map((record: any) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {record.vocabulary?.englishExpression}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {record.vocabulary?.japaneseTranslation}
                </p>
              </div>
              <div className="flex gap-4 text-sm shrink-0">
                <Stat label="正解" value={record.correctCount} color="text-green-600" />
                <Stat label="不正解" value={record.incorrectCount} color="text-red-500" />
                <Stat label="streak" value={record.streak} color="text-indigo-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

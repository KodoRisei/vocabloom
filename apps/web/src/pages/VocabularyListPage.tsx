import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vocabularyApi } from '../services/vocabulary.api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function VocabularyListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vocabularies', { search, page }],
    queryFn: () => vocabularyApi.list({ search: search || undefined, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vocabularyApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vocabularies'] }),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">単語一覧</h1>
        <Link to="/vocabularies/new">
          <Button>+ 単語を追加</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="英語・日本語で検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">単語が登録されていません</p>
          <Link to="/vocabularies/new">
            <Button variant="secondary">最初の単語を追加する</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((vocab) => (
              <div
                key={vocab.id}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{vocab.englishExpression}</p>
                  <p className="text-sm text-gray-500 truncate">{vocab.japaneseTranslation}</p>
                </div>
                {vocab.learningRecord && (
                  <span className="shrink-0 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    streak: {vocab.learningRecord.streak}
                  </span>
                )}
                <div className="flex gap-2 shrink-0">
                  <Link to={`/vocabularies/${vocab.id}/edit`}>
                    <Button variant="ghost" size="sm">編集</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('削除しますか？')) deleteMutation.mutate(vocab.id);
                    }}
                  >
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {meta && meta.total > meta.limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                前へ
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {page} / {Math.ceil(meta.total / meta.limit)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(meta.total / meta.limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

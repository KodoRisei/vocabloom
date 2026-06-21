import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '../services/vocabulary.api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function VocabularyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [english, setEnglish] = useState('');
  const [japanese, setJapanese] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ english?: string; japanese?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => vocabularyApi.get(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.data) {
      setEnglish(data.data.englishExpression);
      setJapanese(data.data.japaneseTranslation);
      setNotes(data.data.notes ?? '');
    }
  }, [data]);

  const createMutation = useMutation({
    mutationFn: () =>
      vocabularyApi.create({ englishExpression: english, japaneseTranslation: japanese, notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      navigate('/vocabularies');
    },
    onError: (err: { response?: { status?: number; data?: { message?: string } } }) => {
      if (err.response?.status === 409) {
        setErrors((prev) => ({ ...prev, english: err.response?.data?.message ?? '既に登録されています' }));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      vocabularyApi.update(id!, { englishExpression: english, japaneseTranslation: japanese, notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularies'] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary', id] });
      navigate('/vocabularies');
    },
    onError: (err: { response?: { status?: number; data?: { message?: string } } }) => {
      if (err.response?.status === 409) {
        setErrors((prev) => ({ ...prev, english: err.response?.data?.message ?? '既に登録されています' }));
      }
    },
  });

  const validate = () => {
    const e: typeof errors = {};
    if (!english.trim()) e.english = '英語表現は必須です';
    if (!japanese.trim()) e.japanese = '日本語訳は必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    isEdit ? updateMutation.mutate() : createMutation.mutate();
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '単語を編集' : '単語を追加'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="英語表現"
          placeholder="例: look after"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          error={errors.english}
        />
        <Input
          label="日本語訳"
          placeholder="例: ～の世話をする"
          value={japanese}
          onChange={(e) => setJapanese(e.target.value)}
          error={errors.japanese}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">メモ（任意）</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            rows={3}
            placeholder="例文や補足メモ..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : isEdit ? '更新する' : '追加する'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/vocabularies')}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}

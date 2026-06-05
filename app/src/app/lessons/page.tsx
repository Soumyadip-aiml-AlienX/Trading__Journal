'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/shared/Toast';

interface Lesson {
  id: string;
  date: string;
  content: string;
  category: string;
  tags?: string;
  tradeId?: string | null;
}

const CATEGORIES = ['All', 'Strategy', 'Psychology', 'Risk', 'Market'];

export default function LessonsDatabasePage() {
  const toast = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  
  // Create form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Strategy');
  const [submitting, setSubmitting] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);

      const res = await fetch(`/api/lessons?${params.toString()}`);
      if (res.ok) {
        setLessons(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          category: newCategory,
          date: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setNewContent('');
        setShowAddForm(false);
        toast.success('New lesson added to database!');
        fetchLessons();
      } else {
        toast.error('Failed to add lesson.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Strategy': return 'bg-[var(--color-accent-dim)] text-[var(--color-accent-light)]';
      case 'Psychology': return 'bg-purple-950/40 text-purple-400';
      case 'Risk': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
      case 'Market': return 'bg-teal-950/40 text-teal-400';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🎓 Lessons Database</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Searchable log of lessons and reminders extracted from your daily reflections and trades.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs"
        >
          {showAddForm ? 'Close Form' : '➕ Add Lesson'}
        </button>
      </div>

      {/* Add New Lesson Form */}
      {showAddForm && (
        <form onSubmit={handleAddLesson} className="glass-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Create New Lesson
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label htmlFor="lesson-content" className="form-label">Lesson Content *</label>
              <input
                id="lesson-content"
                type="text"
                placeholder="What did you learn? (e.g. Always wait for FVG closure before entry)"
                className="form-input"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="lesson-category" className="form-label">Category</label>
              <select
                id="lesson-category"
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option>Strategy</option>
                <option>Psychology</option>
                <option>Risk</option>
                <option>Market</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary px-4 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-1.5"
            >
              {submitting ? 'Saving...' : 'Save Lesson'}
            </button>
          </div>
        </form>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-2.5 text-xs text-[var(--color-text-muted)]">🔍</span>
          <input
            type="text"
            placeholder="Search lessons..."
            className="form-input pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-full transition-all border font-medium cursor-pointer ${
                category === cat
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-active)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="p-12 text-center text-[var(--color-text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading lessons...
        </div>
      ) : lessons.length === 0 ? (
        <div className="glass-card p-12 text-center text-[var(--color-text-muted)]">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm">No lessons found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="glass-card p-4 flex gap-4 items-start hover:border-slate-700 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getCategoryBadgeClass(lesson.category)}`}>
                    {lesson.category}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    {new Date(lesson.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-primary)] leading-relaxed font-medium">
                  {lesson.content}
                </p>
              </div>

              {lesson.tradeId && (
                <a
                  href={`/trades/detail?id=${lesson.tradeId}`}
                  className="text-[10px] text-[var(--color-accent-light)] hover:underline whitespace-nowrap bg-blue-950/20 px-2 py-1 rounded border border-blue-900/30"
                >
                  View Trade ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

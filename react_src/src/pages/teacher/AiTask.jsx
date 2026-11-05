import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';
import { LEVELS } from './People';
import { generateTask } from '../../api';

export default function AiTask() {
  const [f, setF] = useState({
    prompt: '',
    type: 'test',
    kind: 'extra',
    level: LEVELS[0],
    count: 10,
    due: '',
  });

  const [d, setD] = useState(null);
  const [gr, setGr] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);

    try {
      const data = await apiRequest('/groups');
      setGr(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Guruhlarni yuklashda xatolik');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const groups = gr.filter(
    group => group.level === f.level
  );

  const updateField = (key, value) => {
    setF(current => ({ ...current, [key]: value }));
  };

  const generate = async () => {
    if (!f.prompt.trim()) {
      setError('Vazifa mavzusini kiriting.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    setD(null);

    try {
      const result = await generateTask({
        ...f,
        prompt: f.prompt.trim(),
        count: Math.max(1, Math.min(100, Number(f.count) || 10)),
      });

      if (!result || !result.title) {
        throw new Error('AI vazifa yaratmadi. Qayta urinib ko‘ring.');
      }

      setD({
        ...result,
        questions: Array.isArray(result.questions)
          ? result.questions
          : [],
      });
    } catch (e) {
      setError(e.message || 'AI vazifa yaratishda xatolik');
    } finally {
      setGenerating(false);
    }
  };

  const send = async groupId => {
    if (!d?.title?.trim()) {
      setError('Vazifa nomini kiriting.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: d.title.trim(),
        body: d.body || '',
        questions: Array.isArray(d.questions)
          ? d.questions
          : [],
        type: f.type,
        kind: f.kind,
        level: f.level,
        groupId: groupId || null,
        studentIds: [],
        due: f.due || '',
      };

      const result = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const recipientCount = Number(result?.recipients);

      setSuccess(
        `Vazifa muvaffaqiyatli yuborildi!${
          Number.isFinite(recipientCount)
            ? ` O‘quvchilar soni: ${recipientCount}.`
            : ''
        }`
      );

      setD(null);
      setF(current => ({
        ...current,
        prompt: '',
      }));
    } catch (e) {
      setError(e.message || 'Vazifani saqlashda xatolik');
    } finally {
      setSending(false);
    }
  };

  const sel = (key, options) => (
    <select
      className="fi"
      style={{ marginBottom: 6 }}
      value={f[key]}
      onChange={e => updateField(
        key,
        key === 'count' ? Number(e.target.value) : e.target.value
      )}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  return (
    <div className="wrap">
      <h3>AI vazifa yaratish</h3>

      <div className="card">
        <textarea
          className="fi"
          rows={3}
          placeholder="Masalan: Present Perfect bo'yicha 20 ta test tuz"
          value={f.prompt}
          onChange={e => updateField('prompt', e.target.value)}
          style={{ marginBottom: 6 }}
        />

        {sel('type', [
          'test',
          'reading',
          'speaking',
          'writing',
          'image',
        ])}

        {sel('kind', ['extra', 'daily'])}

        {sel('level', LEVELS)}

        <input
          className="fi"
          type="number"
          min="1"
          max="100"
          value={f.count}
          onChange={e => updateField(
            'count',
            Math.max(1, Math.min(100, Number(e.target.value) || 1))
          )}
          style={{ marginBottom: 6 }}
        />

        <input
          className="fi"
          type="date"
          value={f.due}
          onChange={e => updateField('due', e.target.value)}
          style={{ marginBottom: 6 }}
        />

        <button
          className="btn btn-p"
          disabled={generating || sending}
          onClick={generate}
        >
          {generating
            ? '⏳ AI vazifa yaratyapti...'
            : '🤖 AI bilan yaratish'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ color: '#e74c3c' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="card">
          {success}
        </div>
      )}

      {loadingGroups && (
        <div style={{ marginTop: 10 }}>
          Guruhlar yuklanmoqda...
        </div>
      )}

      {d && (
        <div className="card">
          <b>Oldindan ko'rish</b>

          <input
            className="fi"
            value={d.title || ''}
            onChange={e => setD(current => ({
              ...current,
              title: e.target.value,
            }))}
            style={{ margin: '8px 0' }}
          />

          <textarea
            className="fi"
            rows={3}
            value={d.body || ''}
            onChange={e => setD(current => ({
              ...current,
              body: e.target.value,
            }))}
          />

          {d.questions.length > 0 && (
            <textarea
              className="fi"
              rows={8}
              style={{ marginTop: 8 }}
              value={d.questions.join('\n')}
              onChange={e => setD(current => ({
                ...current,
                questions: e.target.value
                  .split('\n')
                  .filter(Boolean),
              }))}
            />
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 10,
            }}
          >
            <button
              className="btn btn-p"
              disabled={sending || loadingGroups}
              onClick={() => send(null)}
            >
              {sending ? 'Yuborilmoqda...' : 'Butun darajaga'}
            </button>

            {groups.map(group => (
              <button
                className="btn"
                key={group.id}
                disabled={sending}
                onClick={() => send(group.id)}
              >
                {group.name} guruhiga
              </button>
            ))}

            {!loadingGroups && groups.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                Bu daraja uchun alohida guruhlar topilmadi.
                Vazifani butun darajaga yuborishingiz mumkin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
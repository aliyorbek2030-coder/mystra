import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Num from '../../components/Num';
import confetti from '../../lib/confetti';
import { loadStudentTasks, submitTask, finishDay } from '../../api';
import ProgressBar from '../../components/ProgressBar';

export default function Tasks() {
  const { user: me } = useAuth();

  const [data, setData] = useState({
    tasks: [],
    submissions: [],
    daySubmits: [],
    sub: { active: false, days: 0 },
    stats: {
      streak: 0,
      xp: 0,
      lvl: 1,
      att: { p: 0, t: 0 },
    },
    rating: { score: 0, avg: 0, days: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dr, setDr] = useState({
    text: '',
    answers: [],
    audio: null,
    files: [],
    rec: false,
  });

  const [recorder, setRecorder] = useState(null);

  const reload = useCallback(async () => {
    try {
      setError('');

      const result = await loadStudentTasks();

      setData(result);

      const dailyDays = [
        ...new Set(
          result.tasks
            .filter(task => task.kind === 'daily')
            .map(task => task.createdAt)
        ),
      ].sort().reverse();

      setSelectedDay(current =>
        current && dailyDays.includes(current)
          ? current
          : dailyDays[0] || ''
      );
    } catch (err) {
      setError(err.message || 'Maʼlumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, me?.id]);

  const tasks = data.tasks;
  const subs = data.submissions;
  const daySubmits = data.daySubmits;
  const sb = data.sub || { active: false, days: 0 };
  const stats = data.stats || {};
  const att = stats.att || { p: 0, t: 0 };

  const days = [
    ...new Set(
      tasks
        .filter(task => task.kind === 'daily')
        .map(task => task.createdAt)
    ),
  ].sort().reverse();

  const day = selectedDay && days.includes(selectedDay)
    ? selectedDay
    : days[0] || '';

  const dailyTasks = tasks.filter(
    task => task.kind === 'daily' && task.createdAt === day
  );

  const daySubmission = daySubmits.find(item => item.day === day);

  const submissionOf = task =>
    subs.find(
      submission =>
        submission.taskId === task.id &&
        (
          task.kind !== 'daily' ||
          submission.day === task.createdAt
        )
    );

  const completed = dailyTasks.filter(task => submissionOf(task)).length;

  const pct = dailyTasks.length
    ? Math.round(completed / dailyTasks.length * 100)
    : 0;

  function startTask(task) {
    setOpen(task);

    setDr({
      text: '',
      answers: [],
      audio: null,
      files: [],
      rec: false,
    });
  }

  async function recordAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());

        const blob = new Blob(chunks, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        const reader = new FileReader();

        reader.onload = () => {
          setDr(current => ({
            ...current,
            audio: reader.result,
            rec: false,
          }));
        };

        reader.onerror = () => {
          setDr(current => ({ ...current, rec: false }));
          alert('Audio faylini o‘qib bo‘lmadi.');
        };

        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setDr(current => ({ ...current, rec: true }));

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 120000);
    } catch {
      alert('Mikrofon ruxsati kerak.');
    }
  }

  function pickFiles(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';

    for (const file of selected) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert(`${file.name}: fayl 1.5 MB dan katta.`);
        continue;
      }

      setDr(current => {
        if (current.files.length >= 3) {
          alert('Eng ko‘pi bilan 3 ta fayl yuklash mumkin.');
          return current;
        }

        const reader = new FileReader();

        reader.onload = () => {
          setDr(previous => ({
            ...previous,
            files: [
              ...previous.files,
              {
                n: file.name,
                d: reader.result,
              },
            ].slice(0, 3),
          }));
        };

        reader.onerror = () => {
          alert(`${file.name}: faylni o‘qib bo‘lmadi.`);
        };

        reader.readAsDataURL(file);

        return current;
      });
    }
  }

  async function sendTask(task) {
    if (!sb.active) {
      alert('Obuna muddati tugagan.');
      return;
    }

    if (
      !dr.text.trim() &&
      !dr.audio &&
      dr.files.length === 0 &&
      dr.answers.filter(Boolean).length === 0
    ) {
      alert('Avval javob kiriting.');
      return;
    }

    setBusy(true);

    try {
      await submitTask(me, task, dr);

      setOpen(null);

      // Reload the actual database state after submission.
      await reload();

      alert('Vazifa muvaffaqiyatli yuborildi.');
    } catch (err) {
      alert(err.message || 'Vazifani yuborib bo‘lmadi.');
    } finally {
      setBusy(false);
    }
  }

  async function submitDay() {
    if (!day) {
      alert('Kunlik vazifalar topilmadi.');
      return;
    }

    if (!completed) {
      alert('Avval kamida bitta vazifani bajaring.');
      return;
    }

    setBusy(true);

    try {
      await finishDay(me, day);
      confetti();

      await reload();

      alert('Kunlik vazifalar ustozga yuborildi.');
    } catch (err) {
      alert(err.message || 'Kunlik vazifalarni yuborib bo‘lmadi.');
    } finally {
      setBusy(false);
    }
  }

  function TaskRow({ task, extra = false }) {
    const submission = submissionOf(task);

    const canSubmit =
      sb.active &&
      (extra || !daySubmission);

    const canRetry =
      submission &&
      canSubmit &&
      (
        extra
          ? submission.status === 'ai'
          : true
      );

    const showSubmitButton =
      !submission || canRetry;

    let statusText = '';

    if (submission) {
      if (submission.status === 'approved') {
        statusText = `✓ Tasdiqlandi${submission.final != null ? ` · ${submission.final}%` : ''}`;
      } else if (submission.status === 'ai') {
        statusText = '⏳ Tekshirilmoqda';
      } else {
        statusText = '✓ Topshirildi';
      }
    }

    return (
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <b>{task.title}</b>

          {extra && (
            <span
              style={{
                marginLeft: 6,
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 12,
              }}
            >
              ⭐ Extra work
            </span>
          )}

          <div
            style={{
              fontSize: 12,
              color: 'var(--text3)',
              marginTop: 4,
            }}
          >
            {task.type || 'Vazifa'}
            {task.due ? ` · Muddat: ${task.due}` : ''}
          </div>

          {statusText && (
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  submission?.status === 'approved'
                    ? 'var(--success)'
                    : 'var(--text3)',
              }}
            >
              {statusText}
            </div>
          )}
        </div>

        {showSubmitButton && (
          <button
            className={`btn ${!submission || canRetry ? 'btn-p' : ''}`}
            disabled={!canSubmit || busy}
            onClick={() => startTask(task)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {submission ? '🔄 Qayta topshirish' : 'Topshirish'}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wrap">
        <div className="card">Vazifalar yuklanmoqda...</div>
      </div>
    );
  }

  if (error && !tasks.length) {
    return (
      <div className="wrap">
        <div className="card">
          <b>Maʼlumotlarni yuklab bo‘lmadi.</b>
          <p>{error}</p>
          <button className="btn btn-p" onClick={reload}>
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  if (open) {
    return (
      <div className="wrap">
        <button
          className="btn"
          disabled={busy}
          onClick={() => setOpen(null)}
        >
          ← Orqaga
        </button>

        <div className="card">
          <h3>
            {open.title}
            {open.kind === 'extra' ? ' ⭐' : ''}
          </h3>

          <p>{open.body}</p>

          {(open.questions || []).map((question, index) => {
            const parts = question.split('|');

            return (
              <div key={index} style={{ margin: '12px 0' }}>
                <b>
                  {index + 1}. {parts[0]}
                </b>

                {['A', 'B', 'C', 'D'].map((letter, optionIndex) => (
                  <label
                    key={letter}
                    style={{
                      display: 'block',
                      padding: '6px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={dr.answers[index] === letter}
                      disabled={busy}
                      onChange={() => {
                        setDr(current => {
                          const answers = [...current.answers];
                          answers[index] = letter;

                          return { ...current, answers };
                        });
                      }}
                    />

                    {' '}
                    {letter}) {parts[optionIndex + 1] || ''}
                  </label>
                ))}
              </div>
            );
          })}

          <textarea
            className="fi"
            rows={5}
            placeholder="Javobingiz..."
            value={dr.text}
            disabled={busy}
            onChange={event =>
              setDr(current => ({
                ...current,
                text: event.target.value,
              }))
            }
          />

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              margin: '10px 0',
            }}
          >
            {dr.rec ? (
              <button
                className="btn"
                disabled={busy}
                onClick={() => recorder?.stop()}
              >
                ⏹ To‘xtatish
              </button>
            ) : (
              <button
                className="btn"
                disabled={busy}
                onClick={recordAudio}
              >
                🎤 Audio (2 daqiqa)
              </button>
            )}

            <label
              className="btn"
              style={{
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              📎 Rasm/fayl

              <input
                type="file"
                hidden
                multiple
                disabled={busy}
                accept="image/*,.pdf,.doc,.docx"
                onChange={pickFiles}
              />
            </label>
          </div>

          {dr.audio && (
            <div style={{ margin: '10px 0' }}>
              <audio
                controls
                src={dr.audio}
                style={{ width: '100%' }}
              />

              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  setDr(current => ({
                    ...current,
                    audio: null,
                  }))
                }
              >
                Audio faylini olib tashlash
              </button>
            </div>
          )}

          {dr.files.map((file, index) => (
            <div
              key={`${file.n}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                padding: '4px 0',
              }}
            >
              <span>📎 {file.n}</span>

              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  setDr(current => ({
                    ...current,
                    files: current.files.filter((_, i) => i !== index),
                  }))
                }
              >
                ✕
              </button>
            </div>
          ))}

          <button
            className="btn btn-p"
            style={{ width: '100%', marginTop: 12 }}
            disabled={busy || dr.rec || !sb.active}
            onClick={() => sendTask(open)}
          >
            {busy ? 'Yuborilmoqda...' : 'Topshirish'}
          </button>

          {!sb.active && (
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>
              Obuna muddati tugagan. Vazifa topshirish uchun obunani
              yangilash kerak.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p>{error}</p>
          <button className="btn" onClick={reload}>
            Yangilash
          </button>
        </div>
      )}

      {!sb.active && (
        <div
          className="card"
          style={{ borderColor: 'var(--danger)' }}
        >
          <b>Obuna muddati tugagan.</b>
          <p>Natijalarni ko‘rishingiz mumkin, lekin vazifa topshira olmaysiz.</p>
        </div>
      )}

      {sb.active && sb.days <= 3 && (
        <div className="card">
          Obunaga {sb.days} kun qoldi.
        </div>
      )}

      {(() => {
        const total = dailyTasks.length;
        const ringPct = total ? Math.round((completed / total) * 100) : 0;
        const left = total - completed;
        const firstName = (me?.name || '').split(' ')[0];
        return (
          <section
            aria-label="Bugungi holat"
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#5B6070' }}>{me?.level ? `${me.level} daraja` : 'Bugun'}</div>
                <h1 style={{ margin: '2px 0 0', fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 28, fontWeight: 600 }}>Salom, {firstName}</h1>
              </div>
              <div
                title="Ketma-ket kunlar"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#FFC38F,#FF7A45)', color: '#fff', padding: '8px 14px', borderRadius: 99, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 4px 0 #E2551F' }}
              >
                <span className="flame"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3s1-3 0-7z" /></svg></span>
                {stats.streak ?? 0} kun
              </div>
            </div>

            <div className="pop-in" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#8B7CFF 0%,#5B4BFF 50%,#C026D3 100%)', color: '#fff', borderRadius: 26, padding: 22, display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 12px 30px rgba(91,75,255,.30)' }}>
              <div aria-hidden="true" style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(212,247,74,.9)' }} />
              <div
                role="img"
                className="ring-anim"
                aria-label={`Bugun ${completed} / ${total} vazifa bajarildi`}
                style={{ width: 84, height: 84, borderRadius: 99, '--p': ringPct, background: 'conic-gradient(#D4F74A calc(var(--p) * 3.6deg), rgba(255,255,255,.22) 0)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <div style={{ width: 66, height: 66, borderRadius: 99, background: '#4F3FE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka','Onest',sans-serif", fontWeight: 700, fontSize: 22 }}>
                  {completed}/{total}
                </div>
              </div>
              <div style={{ minWidth: 0, position: 'relative' }}>
                <div style={{ fontSize: 13, color: '#E4E1FF' }}>Bugungi reja</div>
                <div style={{ fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 24, fontWeight: 600, marginTop: 2 }}>
                  {total === 0 ? 'Bugun vazifa yo‘q' : left === 0 ? 'Hammasi bajarildi!' : `${left} ta vazifa qoldi`}
                </div>
                <div style={{ display: 'inline-block', fontSize: 13, color: '#12131A', background: '#D4F74A', marginTop: 8, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>
                  <Num value={`${stats.xp ?? 0} XP`} /> · {stats.lvl ?? 1}-daraja
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {[
                ['Ketma-ketlik', `${stats.streak ?? 0} kun`],
                ['Davomat', att.t ? `${att.p}/${att.t}` : '—'],
                ['Obuna', sb.active ? `${sb.days} kun` : 'Tugagan'],
              ].map(([label, value], i) => (
                <div key={label} className="lift page-in" style={{ animationDelay: `${0.2 + i * 0.08}s`, background: ['#FFE4D6', '#E0F2FE', '#ECFCCB'][i], borderRadius: 18, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ['#9A3412', '#075985', '#3F6212'][i] }}>{label}</div>
                  <div style={{ fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 20, fontWeight: 700, marginTop: 2, color: '#12131A' }}>{value}</div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {days.length > 1 && (
        <select
          className="fi"
          value={day}
          onChange={event => setSelectedDay(event.target.value)}
          style={{ marginBottom: 8 }}
        >
          {days.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}

      {dailyTasks.length > 0 ? (
        <>
          <ProgressBar
            pct={
              daySubmission?.status === 'approved'
                ? daySubmission.final
                : pct
            }
            label={
              daySubmission?.status === 'approved'
                ? 'Natija ✓ tasdiqlandi'
                : 'Kunlik natija'
            }
            hint={`${completed}/${dailyTasks.length} vazifa bajarildi`}
          />

          {dailyTasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}

          {daySubmission ? (
            <div className="card">
              {daySubmission.status === 'approved'
                ? `Ustoz tasdiqladi: ${daySubmission.final}%`
                : 'Ustozga yuborildi, tekshirilmoqda...'}
            </div>
          ) : (
            <button
              className="btn btn-p"
              style={{ width: '100%' }}
              disabled={!completed || !sb.active || busy}
              onClick={submitDay}
            >
              {busy
                ? 'Yuborilmoqda...'
                : 'Yakunlash va ustozga yuborish'}
            </button>
          )}
        </>
      ) : (
        <div className="card" style={{ color: 'var(--text3)' }}>
          {tasks.length
            ? 'Bu kun uchun kunlik vazifa yo‘q.'
            : 'Sizga hali vazifa berilmagan.'}
        </div>
      )}

      <h4>⭐ Extra work (qo‘shimcha vazifalar)</h4>

      {tasks
        .filter(task => task.kind === 'extra')
        .map(task => (
          <TaskRow key={task.id} task={task} extra />
        ))}

      {!tasks.some(task => task.kind === 'extra') && (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>
          Hozircha qo‘shimcha vazifalar yo‘q.
        </div>
      )}

      <button
        className="btn"
        style={{ width: '100%', marginTop: 12 }}
        disabled={busy}
        onClick={reload}
      >
        ↻ Maʼlumotlarni yangilash
      </button>
    </div>
  );
}
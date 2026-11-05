import { S, uid, today } from '../lib/storage';
import { apiRequest } from '../lib/auth';

/*
 * STUDENT API
 * Django is the source of truth for student tasks and submissions.
 */

export async function loadStudentTasks() {
  const data = await apiRequest('/my/tasks');

  return {
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    submissions: Array.isArray(data.submissions) ? data.submissions : [],
    daySubmits: Array.isArray(data.daySubmits) ? data.daySubmits : [],
    sub: data.sub || { active: false, days: 0 },
    stats: data.stats || {
      streak: 0,
      xp: 0,
      lvl: 1,
      att: { p: 0, t: 0 },
    },
    rating: data.rating || { score: 0, avg: 0, days: 0 },
  };
}

export async function submitTask(me, task, submission) {
  if (!task?.id) {
    throw new Error('Vazifa ID topilmadi.');
  }

  const payload = {
    text: submission.text || '',
    answers: Array.isArray(submission.answers)
      ? submission.answers
      : [],
    audio: submission.audio || null,
    files: Array.isArray(submission.files)
      ? submission.files.map((file) => ({
          n: file.n,
          d: file.d,
        }))
      : [],
  };

  return apiRequest(`/tasks/${encodeURIComponent(task.id)}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function finishDay(me, day) {
  if (!day) {
    throw new Error('Kun tanlanmagan.');
  }

  return apiRequest(
    `/days/${encodeURIComponent(day)}/finish`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
}

/*
 * BACKWARD-COMPATIBILITY FUNCTIONS
 */

export const allTasks = () => [
  ...(S.get('tasks') || []),
  ...(S.get('homeworks') || []).map((homework) => ({
    id: homework.id,
    title: homework.title,
    body: 'Vazifani bajarib, javobingizni yozing.',
    questions: [],
    type: 'writing',
    kind: 'daily',
    level: homework.level,
    studentIds: [],
    createdAt: today(),
    fromList: true,
  })),
];

export const myTasks = (me) =>
  allTasks().filter((task) =>
    task.studentIds?.length
      ? task.studentIds.includes(me.id)
      : task.level === me.level &&
        (!task.groupId || task.groupId === me.groupId)
  );

export const getSubmissions = (studentId) =>
  (S.get('submissions') || []).filter(
    (submission) => submission.studentId === studentId
  );

export async function checkSubmission(submission, task) {
  if (task.type === 'test' && task.questions?.length) {
    const correct = task.questions.filter(
      (question, index) =>
        (submission.answers || [])[index] === question.split('|')[5]
    ).length;

    return {
      score: Math.round(
        (correct / task.questions.length) * 100
      ),
      feedback: `Avto-tekshiruv: ${correct}/${task.questions.length}`,
    };
  }

  return {
    score: Math.min(
      95,
      45 + Math.round((submission.text || '').length / 8)
    ),
    feedback: 'AI (namuna javob)',
  };
}

/*
 * AI TASK GENERATION
 */

export async function generateTask(params) {
  return apiRequest('/ai/generate-task', {
    method: 'POST',
    body: JSON.stringify({
      prompt: params.prompt,
      type: params.type || 'test',
      count: params.count || 10,
      level: params.level,
    }),
  });
}

/*
 * SUBSCRIPTIONS
 */

export function subInfo(id) {
  const subscriptions = S.get('subs') || {};

  if (!subscriptions[id]) {
    subscriptions[id] = {
      until: Date.now() + 7 * 864e5,
    };

    S.set('subs', subscriptions);
  }

  const days = Math.ceil(
    (subscriptions[id].until - Date.now()) / 864e5
  );

  return {
    active: days > 0,
    days,
  };
}

export async function extendSub(id) {
  if (!id) {
    throw new Error('O‘quvchi ID topilmadi.');
  }

  return apiRequest(
    `/subscriptions/${encodeURIComponent(id)}/extend`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
}

/*
 * AI SUGGESTIONS
 * All three operations use Django endpoints.
 */

// Load suggestions from Django.
export async function getSuggestions() {
  const data = await apiRequest('/suggestions');

  return Array.isArray(data) ? data : [];
}

// Compatibility alias for existing imports.
// This function is now asynchronous.
export async function suggestions() {
  return getSuggestions();
}

// Dismiss a suggestion through Django.
export async function skipSuggestion(groupId) {
  const id =
    typeof groupId === 'object'
      ? groupId?.g?.id ?? groupId?.group?.id
      : groupId;

  if (!id) {
    throw new Error('Guruh ID topilmadi.');
  }

  return apiRequest('/suggestions/skip', {
    method: 'POST',
    body: JSON.stringify({ groupId: id }),
  });
}

// Create a revision task through Django.
export async function sendSuggestion(groupId, all = false) {
  const id =
    typeof groupId === 'object'
      ? groupId?.g?.id ?? groupId?.group?.id
      : groupId;

  if (!id) {
    throw new Error('Guruh ID topilmadi.');
  }

  return apiRequest('/suggestions/send', {
    method: 'POST',
    body: JSON.stringify({
      groupId: id,
      all: Boolean(all),
    }),
  });
}
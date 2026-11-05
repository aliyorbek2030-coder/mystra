import { apiRequest } from './auth';

// Save a manually checked lesson through Django.
// Django handles the record, certificate, and notification.
export async function saveManualRecord(sid, date, items, note) {
  const ticked = (items || []).filter(
    item => item.ticked && !item.crossed
  );

  const avg = ticked.length
    ? Math.round(
        ticked.reduce(
          (sum, item) => sum + (Number(item.pct) || 0),
          0
        ) / ticked.length
      )
    : 0;

  try {
    const result = await apiRequest('/manual-records', {
      method: 'POST',
      body: JSON.stringify({
        studentId: sid,
        date,
        items: items || [],
        note: note || "Dars (qo'lda)",
      }),
    });

    return {
      ...result,
      avg: result.avg ?? avg,
      cert: Boolean(result.cert),
    };
  } catch (error) {
    console.error('Failed to save manual record:', error);
    throw error;
  }
}
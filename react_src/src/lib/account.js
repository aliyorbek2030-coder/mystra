import { apiRequest } from './auth';

export async function changePassword(user, oldp, newp) {
  if ((newp || '').length < 4) {
    return 'Parol kamida 4 belgi bo\'lsin.';
  }

  if (!user?.id) {
    return 'Foydalanuvchi aniqlanmadi. Qayta kiring.';
  }

  try {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: oldp,
        newPassword: newp,
      }),
    });

    return null;
  } catch (error) {
    return error.message || 'Parolni o\'zgartirishda xatolik yuz berdi.';
  }
}
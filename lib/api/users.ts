export async function fetchAvailableUsers(params?: { shiftId?: string }): Promise<any[]> {
  try {
    const url = params?.shiftId
      ? `/api/helpers?shiftId=${params.shiftId}`
      : '/api/helpers';
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.helpers || [];
    }
    return [];
  } catch {
    return [];
  }
}

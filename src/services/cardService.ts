export async function getCards() {
  const res = await fetch("https://q1z3telex7a9metry.denaliops.com/data.json");
  if (!res.ok) throw new Error('Failed to fetch cards');
  return await res.json();
} 
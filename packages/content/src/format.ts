const rupeeFormatter = new Intl.NumberFormat('en-IN');

export function formatRupees(amount: number): string {
  return `₹${rupeeFormatter.format(amount)}`;
}

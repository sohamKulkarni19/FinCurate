declare module 'xirr' {
  export default function xirr(transactions: { amount: number; when: Date }[], options?: { guess?: number }): number;
}

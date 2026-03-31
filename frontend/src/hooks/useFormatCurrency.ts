import { useCurrency } from "./useCurrency";

/**
 * Returns a formatCurrency function that converts from USD to the selected currency.
 * Use this instead of importing formatCurrency from utils directly.
 */
export function useFormatCurrency() {
  const { formatAmount } = useCurrency();
  return formatAmount;
}

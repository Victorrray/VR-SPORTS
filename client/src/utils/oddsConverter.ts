import { OddsFormat } from '../contexts/ThemeContext';

/**
 * Convert American odds to decimal odds
 * American +150 = Decimal 2.50
 * American -110 = Decimal 1.91
 */
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

/**
 * Convert American odds to fractional odds
 * American +150 = Fractional 3/2
 * American -110 = Fractional 10/11
 */
export function americanToFractional(american: number): string {
  let numerator: number;
  let denominator: number;

  if (american > 0) {
    numerator = american;
    denominator = 100;
  } else {
    numerator = 100;
    denominator = Math.abs(american);
  }

  // Find GCD to simplify fraction
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);
  
  numerator = numerator / divisor;
  denominator = denominator / divisor;

  return `${numerator}/${denominator}`;
}

/**
 * Parse odds string/number to a numeric American odds value
 */
export function parseAmericanOdds(odds: string | number): number {
  if (typeof odds === 'number') return odds;
  
  const cleaned = String(odds).replace(/[^0-9+-]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Format odds based on the selected format
 * @param odds - American odds as string or number (e.g., "+150", -110, "−110")
 * @param format - The desired output format
 * @returns Formatted odds string
 */
export function formatOdds(odds: string | number, format: OddsFormat): string {
  const american = parseAmericanOdds(odds);
  
  if (american === 0) return '--';

  switch (format) {
    case 'american':
      return american > 0 ? `+${american}` : String(american);
    
    case 'decimal':
      const decimal = americanToDecimal(american);
      return decimal.toFixed(2);
    
    case 'fractional':
      return americanToFractional(american);
    
    default:
      return american > 0 ? `+${american}` : String(american);
  }
}

/**
 * Hook-friendly function that can be used in components
 * Returns a formatter function based on the current odds format
 */
export function createOddsFormatter(format: OddsFormat) {
  return (odds: string | number) => formatOdds(odds, format);
}

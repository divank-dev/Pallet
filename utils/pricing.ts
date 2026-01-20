import { ProductionMethod, LineItem } from '../types';

/**
 * Calculate unit price based on decoration method
 *
 * Formulas:
 * - DTF: (Wholesale * 2.0) + Fee ($5 Standard, $8 Large)
 * - ScreenPrint: (Wholesale * 2.0) + ($2.00 * Placements) + ($1.00 * Colors) + ($2.00 if 2XL+)
 * - Embroidery: (Wholesale * 2.0) + Fee ($0 <8k, $10 8k-12k, $20 12k+)
 * - Other: (Wholesale * 2.0)
 */
export const calculatePrice = (item: Partial<LineItem>): number => {
  const {
    decorationType,
    cost = 0,
    decorationPlacements = 1,
    screenPrintColors = 1,
    isPlusSize = false,
    stitchCountTier = '<8k',
    dtfSize = 'Standard'
  } = item;

  // Base price is wholesale cost * 2
  let price = cost * 2;

  if (decorationType === 'DTF') {
    // DTF: Add placement size fee
    const fee = dtfSize === 'Large' ? 8 : 5;
    price += fee;
  } else if (decorationType === 'ScreenPrint') {
    // Screen Print: Add placement and color fees
    price += (2 * decorationPlacements) + (1 * screenPrintColors);
    // Add surcharge for plus sizes (2XL+)
    if (isPlusSize) price += 2;
  } else if (decorationType === 'Embroidery') {
    // Embroidery: Add stitch count tier fee
    if (stitchCountTier === '12k+') {
      price += 20;
    } else if (stitchCountTier === '8k-12k') {
      price += 10;
    }
    // <8k adds $0
  }
  // "Other" just uses base price (cost * 2)

  return price;
};

/**
 * Get the fee breakdown for display purposes
 */
export const getPriceBreakdown = (item: Partial<LineItem>): {
  base: number;
  fees: { label: string; amount: number }[];
  total: number;
} => {
  const {
    decorationType,
    cost = 0,
    decorationPlacements = 1,
    screenPrintColors = 1,
    isPlusSize = false,
    stitchCountTier = '<8k',
    dtfSize = 'Standard'
  } = item;

  const base = cost * 2;
  const fees: { label: string; amount: number }[] = [];

  if (decorationType === 'DTF') {
    const fee = dtfSize === 'Large' ? 8 : 5;
    fees.push({ label: `${dtfSize} Transfer`, amount: fee });
  } else if (decorationType === 'ScreenPrint') {
    if (decorationPlacements > 0) {
      fees.push({ label: `${decorationPlacements} Placement(s)`, amount: 2 * decorationPlacements });
    }
    if (screenPrintColors > 0) {
      fees.push({ label: `${screenPrintColors} Color(s)`, amount: 1 * screenPrintColors });
    }
    if (isPlusSize) {
      fees.push({ label: '2XL+ Surcharge', amount: 2 });
    }
  } else if (decorationType === 'Embroidery') {
    if (stitchCountTier === '12k+') {
      fees.push({ label: '12k+ Stitches', amount: 20 });
    } else if (stitchCountTier === '8k-12k') {
      fees.push({ label: '8k-12k Stitches', amount: 10 });
    }
  }

  const total = base + fees.reduce((sum, f) => sum + f.amount, 0);

  return { base, fees, total };
};

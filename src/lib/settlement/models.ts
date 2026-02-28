import Decimal from "decimal.js";
import { CommissionModel } from "@prisma/client";

interface CommissionParams {
  model: CommissionModel;
  totalPlatformNet: Decimal;
  commissionRate: Decimal | null;
  fixedFee: Decimal | null;
  hybridThreshold: Decimal | null;
  perRideFee: Decimal | null;
  completedRideCount: number;
  periodDays: number;
  standardPeriodDays: number; // 7 for weekly
}

/**
 * Calculate the fleet owner's commission based on the driver's commission model.
 *
 * PERCENTAGE: partnerCommission = totalPlatformNet * rate / 100
 * FIXED: partnerCommission = fixedFee (prorated if period < standard)
 * HYBRID: fixedFee + max(0, (totalPlatformNet - threshold) * rate / 100)
 * PER_RIDE: completedRideCount * perRideFee
 */
export function calculatePartnerCommission(params: CommissionParams): Decimal {
  const {
    model,
    totalPlatformNet,
    commissionRate,
    fixedFee,
    hybridThreshold,
    perRideFee,
    completedRideCount,
    periodDays,
    standardPeriodDays,
  } = params;

  switch (model) {
    case "PERCENTAGE": {
      const rate = commissionRate ?? new Decimal(0);
      return totalPlatformNet.mul(rate).div(100).toDecimalPlaces(2);
    }

    case "FIXED": {
      const fee = fixedFee ?? new Decimal(0);
      if (periodDays < standardPeriodDays) {
        // Prorate the fixed fee
        return fee
          .mul(periodDays)
          .div(standardPeriodDays)
          .toDecimalPlaces(2);
      }
      return fee.toDecimalPlaces(2);
    }

    case "HYBRID": {
      const fee = fixedFee ?? new Decimal(0);
      const threshold = hybridThreshold ?? new Decimal(0);
      const rate = commissionRate ?? new Decimal(0);

      // Prorate fixed fee if needed
      let proratedFee = fee;
      if (periodDays < standardPeriodDays) {
        proratedFee = fee.mul(periodDays).div(standardPeriodDays);
      }

      const overThreshold = Decimal.max(
        new Decimal(0),
        totalPlatformNet.minus(threshold)
      );
      const variablePart = overThreshold.mul(rate).div(100);

      return proratedFee.plus(variablePart).toDecimalPlaces(2);
    }

    case "PER_RIDE": {
      const fee = perRideFee ?? new Decimal(0);
      return fee.mul(completedRideCount).toDecimalPlaces(2);
    }

    default:
      return new Decimal(0);
  }
}

/**
 * Prorate monthly vehicle costs to the settlement period.
 */
export function prorateMonthlyToperiod(
  monthlyCost: Decimal | null,
  periodDays: number
): Decimal {
  if (!monthlyCost || monthlyCost.isZero()) return new Decimal(0);
  // Approximate: monthly = 30.44 days (365.25/12)
  return monthlyCost.mul(periodDays).div(30.44).toDecimalPlaces(2);
}

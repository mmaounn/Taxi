import { Decimal } from "decimal.js";

export interface PlatformBreakdown {
  grossRevenue: Decimal;
  commission: Decimal;
  tips: Decimal;
  bonuses: Decimal;
  netAmount: Decimal;
  // Bolt-specific
  cashServiceFee?: Decimal;
  reimbursements?: Decimal;
  // Uber-specific
  serviceFee?: Decimal;
  cityFees?: Decimal;
  promotions?: Decimal;
}

export interface SettlementInput {
  driverId: string;
  partnerId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface SettlementResult {
  // Platform breakdowns
  bolt: PlatformBreakdown | null;
  uber: PlatformBreakdown | null;
  freenow: PlatformBreakdown | null;

  // Combined
  totalPlatformNet: Decimal;

  // Fleet owner deductions
  partnerCommissionAmount: Decimal;
  vehicleRentalDeduction: Decimal;
  fuelCostDeduction: Decimal;
  insuranceDeduction: Decimal;

  // Cash
  cashCollectedByDriver: Decimal;

  // Final
  driverNetEarnings: Decimal;
  payoutAmount: Decimal;

  // Stats
  totalRides: number;
  completedRides: number;
}

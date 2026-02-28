import Decimal from "decimal.js";
import { db } from "@/lib/db";
import { RideSource } from "@prisma/client";
import { calculatePartnerCommission, prorateMonthlyToperiod } from "./models";
import type { PlatformBreakdown, SettlementInput, SettlementResult } from "./types";

/**
 * Calculate a settlement for a single driver over a given period.
 *
 * 1. Fetch all RideData for the driver in the period
 * 2. Aggregate by platform (BOLT, UBER, FREENOW)
 * 3. Calculate partner commission based on driver's commission model
 * 4. Prorate vehicle costs
 * 5. Compute cash reconciliation and final payout
 */
export async function calculateSettlement(
  input: SettlementInput
): Promise<SettlementResult> {
  const { driverId, periodStart, periodEnd } = input;

  // Fetch driver with vehicle
  const driver = await db.driver.findUniqueOrThrow({
    where: { id: driverId },
    include: { vehicle: true },
  });

  // Fetch all rides in the period
  const rides = await db.rideData.findMany({
    where: {
      driverId,
      OR: [
        {
          completedAt: { gte: periodStart, lte: periodEnd },
        },
        {
          startedAt: { gte: periodStart, lte: periodEnd },
          completedAt: null,
        },
      ],
    },
  });

  // Aggregate by platform
  const boltRides = rides.filter((r) => r.source === RideSource.BOLT);
  const uberRides = rides.filter((r) => r.source === RideSource.UBER);
  const freenowRides = rides.filter((r) => r.source === RideSource.FREENOW);

  function aggregatePlatform(
    platformRides: typeof rides,
    source: RideSource
  ): PlatformBreakdown | null {
    if (platformRides.length === 0) return null;

    let grossRevenue = new Decimal(0);
    let commission = new Decimal(0);
    let tips = new Decimal(0);
    let bonuses = new Decimal(0);
    let cashServiceFee = new Decimal(0);

    for (const ride of platformRides) {
      const fare = new Decimal(ride.fareAmount?.toString() || "0");
      const tip = new Decimal(ride.tipAmount?.toString() || "0");
      const platformComm = new Decimal(
        ride.platformCommissionAmount?.toString() || "0"
      );

      grossRevenue = grossRevenue.plus(fare);
      tips = tips.plus(tip);
      commission = commission.plus(platformComm);

      // Cash service fees for Bolt (rides paid in cash)
      if (source === RideSource.BOLT && ride.paymentMethod === "CASH") {
        // Bolt charges a cash service fee, typically included in platformCommission
        // We track it separately if available
      }
    }

    const netAmount = grossRevenue
      .minus(commission)
      .plus(tips)
      .plus(bonuses)
      .minus(cashServiceFee);

    const breakdown: PlatformBreakdown = {
      grossRevenue: grossRevenue.toDecimalPlaces(2),
      commission: commission.toDecimalPlaces(2),
      tips: tips.toDecimalPlaces(2),
      bonuses: bonuses.toDecimalPlaces(2),
      netAmount: netAmount.toDecimalPlaces(2),
    };

    if (source === RideSource.BOLT) {
      breakdown.cashServiceFee = cashServiceFee.toDecimalPlaces(2);
      breakdown.reimbursements = new Decimal(0);
    }
    if (source === RideSource.UBER) {
      breakdown.serviceFee = commission.toDecimalPlaces(2);
      breakdown.cityFees = new Decimal(0);
      breakdown.promotions = new Decimal(0);
    }

    return breakdown;
  }

  const bolt = aggregatePlatform(boltRides, RideSource.BOLT);
  const uber = aggregatePlatform(uberRides, RideSource.UBER);
  const freenow = aggregatePlatform(freenowRides, RideSource.FREENOW);

  // Total platform net
  const totalPlatformNet = [bolt, uber, freenow]
    .filter(Boolean)
    .reduce(
      (sum, breakdown) => sum.plus(breakdown!.netAmount),
      new Decimal(0)
    )
    .toDecimalPlaces(2);

  // Period length in days
  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const periodDays = Math.max(1, Math.round(periodMs / (1000 * 60 * 60 * 24)));

  // Standard period days based on settlement frequency
  const standardPeriodDays =
    driver.settlementFrequency === "WEEKLY"
      ? 7
      : driver.settlementFrequency === "BIWEEKLY"
      ? 14
      : 30;

  // Calculate completed rides
  const completedRides = rides.filter((r) => r.status === "COMPLETED").length;

  // Partner commission
  const partnerCommissionAmount = calculatePartnerCommission({
    model: driver.commissionModel,
    totalPlatformNet,
    commissionRate: driver.commissionRate
      ? new Decimal(driver.commissionRate.toString())
      : null,
    fixedFee: driver.fixedFee
      ? new Decimal(driver.fixedFee.toString())
      : null,
    hybridThreshold: driver.hybridThreshold
      ? new Decimal(driver.hybridThreshold.toString())
      : null,
    perRideFee: driver.perRideFee
      ? new Decimal(driver.perRideFee.toString())
      : null,
    completedRideCount: completedRides,
    periodDays,
    standardPeriodDays,
  });

  // Vehicle cost deductions (prorated)
  const vehicleRentalDeduction = driver.vehicle
    ? prorateMonthlyToperiod(
        driver.vehicle.monthlyRentalCost
          ? new Decimal(driver.vehicle.monthlyRentalCost.toString())
          : null,
        periodDays
      )
    : new Decimal(0);

  const insuranceDeduction = driver.vehicle
    ? prorateMonthlyToperiod(
        driver.vehicle.insuranceMonthlyCost
          ? new Decimal(driver.vehicle.insuranceMonthlyCost.toString())
          : null,
        periodDays
      )
    : new Decimal(0);

  const fuelCostDeduction = new Decimal(0); // Manual entry, not auto-calculated

  // Cash collected (sum of rides paid in cash)
  const cashCollectedByDriver = rides
    .filter((r) => r.paymentMethod === "CASH")
    .reduce(
      (sum, r) =>
        sum.plus(new Decimal(r.fareAmount?.toString() || "0")),
      new Decimal(0)
    )
    .toDecimalPlaces(2);

  // Driver net earnings = totalPlatformNet - partnerCommission - vehicleCosts - insurance
  const driverNetEarnings = totalPlatformNet
    .minus(partnerCommissionAmount)
    .minus(vehicleRentalDeduction)
    .minus(insuranceDeduction)
    .minus(fuelCostDeduction)
    .toDecimalPlaces(2);

  // Payout = driverNetEarnings - cashCollectedByDriver
  // (cash collected is money the driver already has, so we subtract it from payout)
  const payoutAmount = driverNetEarnings
    .minus(cashCollectedByDriver)
    .toDecimalPlaces(2);

  return {
    bolt,
    uber,
    freenow,
    totalPlatformNet,
    partnerCommissionAmount,
    vehicleRentalDeduction,
    fuelCostDeduction,
    insuranceDeduction,
    cashCollectedByDriver,
    driverNetEarnings,
    payoutAmount,
    totalRides: rides.length,
    completedRides,
  };
}

/**
 * Create or recalculate a settlement in the database.
 */
export async function createOrUpdateSettlement(
  input: SettlementInput
): Promise<string> {
  const result = await calculateSettlement(input);

  // Link rides to this settlement
  const settlement = await db.settlement.upsert({
    where: {
      driverId_periodStart_periodEnd: {
        driverId: input.driverId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      },
    },
    create: {
      driverId: input.driverId,
      partnerId: input.partnerId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: "CALCULATED",
      // Bolt
      boltGrossRevenue: result.bolt?.grossRevenue.toNumber() ?? null,
      boltCommission: result.bolt?.commission.toNumber() ?? null,
      boltCashServiceFee: result.bolt?.cashServiceFee?.toNumber() ?? null,
      boltTips: result.bolt?.tips.toNumber() ?? null,
      boltBonuses: result.bolt?.bonuses.toNumber() ?? null,
      boltReimbursements: result.bolt?.reimbursements?.toNumber() ?? null,
      boltNetAmount: result.bolt?.netAmount.toNumber() ?? null,
      // Uber
      uberGrossRevenue: result.uber?.grossRevenue.toNumber() ?? null,
      uberServiceFee: result.uber?.serviceFee?.toNumber() ?? null,
      uberCityFees: result.uber?.cityFees?.toNumber() ?? null,
      uberTips: result.uber?.tips.toNumber() ?? null,
      uberPromotions: result.uber?.promotions?.toNumber() ?? null,
      uberNetAmount: result.uber?.netAmount.toNumber() ?? null,
      // FreeNow
      freenowGrossRevenue: result.freenow?.grossRevenue.toNumber() ?? null,
      freenowCommission: result.freenow?.commission.toNumber() ?? null,
      freenowTips: result.freenow?.tips.toNumber() ?? null,
      freenowBonuses: result.freenow?.bonuses.toNumber() ?? null,
      freenowNetAmount: result.freenow?.netAmount.toNumber() ?? null,
      // Combined
      totalPlatformNet: result.totalPlatformNet.toNumber(),
      // Deductions
      partnerCommissionAmount: result.partnerCommissionAmount.toNumber(),
      vehicleRentalDeduction: result.vehicleRentalDeduction.toNumber(),
      fuelCostDeduction: result.fuelCostDeduction.toNumber(),
      insuranceDeduction: result.insuranceDeduction.toNumber(),
      // Cash
      cashCollectedByDriver: result.cashCollectedByDriver.toNumber(),
      // Final
      driverNetEarnings: result.driverNetEarnings.toNumber(),
      payoutAmount: result.payoutAmount.toNumber(),
      calculatedAt: new Date(),
    },
    update: {
      status: "CALCULATED",
      boltGrossRevenue: result.bolt?.grossRevenue.toNumber() ?? null,
      boltCommission: result.bolt?.commission.toNumber() ?? null,
      boltCashServiceFee: result.bolt?.cashServiceFee?.toNumber() ?? null,
      boltTips: result.bolt?.tips.toNumber() ?? null,
      boltBonuses: result.bolt?.bonuses.toNumber() ?? null,
      boltReimbursements: result.bolt?.reimbursements?.toNumber() ?? null,
      boltNetAmount: result.bolt?.netAmount.toNumber() ?? null,
      uberGrossRevenue: result.uber?.grossRevenue.toNumber() ?? null,
      uberServiceFee: result.uber?.serviceFee?.toNumber() ?? null,
      uberCityFees: result.uber?.cityFees?.toNumber() ?? null,
      uberTips: result.uber?.tips.toNumber() ?? null,
      uberPromotions: result.uber?.promotions?.toNumber() ?? null,
      uberNetAmount: result.uber?.netAmount.toNumber() ?? null,
      freenowGrossRevenue: result.freenow?.grossRevenue.toNumber() ?? null,
      freenowCommission: result.freenow?.commission.toNumber() ?? null,
      freenowTips: result.freenow?.tips.toNumber() ?? null,
      freenowBonuses: result.freenow?.bonuses.toNumber() ?? null,
      freenowNetAmount: result.freenow?.netAmount.toNumber() ?? null,
      totalPlatformNet: result.totalPlatformNet.toNumber(),
      partnerCommissionAmount: result.partnerCommissionAmount.toNumber(),
      vehicleRentalDeduction: result.vehicleRentalDeduction.toNumber(),
      fuelCostDeduction: result.fuelCostDeduction.toNumber(),
      insuranceDeduction: result.insuranceDeduction.toNumber(),
      cashCollectedByDriver: result.cashCollectedByDriver.toNumber(),
      driverNetEarnings: result.driverNetEarnings.toNumber(),
      payoutAmount: result.payoutAmount.toNumber(),
      calculatedAt: new Date(),
    },
  });

  // Link rides to settlement
  await db.rideData.updateMany({
    where: {
      driverId: input.driverId,
      OR: [
        { completedAt: { gte: input.periodStart, lte: input.periodEnd } },
        { startedAt: { gte: input.periodStart, lte: input.periodEnd }, completedAt: null },
      ],
    },
    data: { settlementId: settlement.id },
  });

  return settlement.id;
}

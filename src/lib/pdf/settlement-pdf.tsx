import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 4 },
  label: { color: "#555" },
  value: { fontWeight: "bold" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#333", marginTop: 4 },
  totalLabel: { fontSize: 12, fontWeight: "bold" },
  totalValue: { fontSize: 12, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
  infoGrid: { flexDirection: "row", marginBottom: 16 },
  infoCol: { flex: 1 },
  positiveAmount: { color: "#16a34a", fontWeight: "bold" },
  negativeAmount: { color: "#dc2626", fontWeight: "bold" },
});

function formatEur(val: number | null | undefined): string {
  if (val == null) return "€0,00";
  const num = Number(val);
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString("de-AT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-€${formatted}` : `€${formatted}`;
}

interface SettlementPDFProps {
  settlement: {
    periodStart: string;
    periodEnd: string;
    status: string;
    boltGrossRevenue?: number | null;
    boltCommission?: number | null;
    boltCashServiceFee?: number | null;
    boltTips?: number | null;
    boltBonuses?: number | null;
    boltNetAmount?: number | null;
    uberGrossRevenue?: number | null;
    uberServiceFee?: number | null;
    uberTips?: number | null;
    uberNetAmount?: number | null;
    freenowGrossRevenue?: number | null;
    freenowCommission?: number | null;
    freenowTips?: number | null;
    freenowNetAmount?: number | null;
    totalPlatformNet?: number | null;
    partnerCommissionAmount?: number | null;
    vehicleRentalDeduction?: number | null;
    fuelCostDeduction?: number | null;
    insuranceDeduction?: number | null;
    lineItemsTotal?: number | null;
    lineItems?: { type: string; description: string; amount: number; isAutoApplied: boolean }[];
    cashCollectedByDriver?: number | null;
    driverNetEarnings?: number | null;
    payoutAmount?: number | null;
    driver: {
      firstName: string;
      lastName: string;
      email?: string | null;
      bankIban?: string | null;
      commissionModel: string;
      commissionRate?: number | null;
    };
  };
  companyName: string;
}

export function SettlementPDF({ settlement, companyName }: SettlementPDFProps) {
  const s = settlement;
  const periodStr = `${new Date(s.periodStart).toLocaleDateString("de-AT")} - ${new Date(s.periodEnd).toLocaleDateString("de-AT")}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Settlement Report</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Driver:</Text>
            <Text style={styles.value}>{s.driver.firstName} {s.driver.lastName}</Text>
            {s.driver.email && <Text style={styles.label}>{s.driver.email}</Text>}
            {s.driver.bankIban && <Text style={styles.label}>IBAN: {s.driver.bankIban}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>{periodStr}</Text>
            <Text style={styles.label}>Status: {s.status}</Text>
            <Text style={styles.label}>Commission: {s.driver.commissionModel} {s.driver.commissionRate ? `(${s.driver.commissionRate}%)` : ""}</Text>
          </View>
        </View>

        {/* Bolt Section */}
        {s.boltGrossRevenue != null && Number(s.boltGrossRevenue) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bolt</Text>
            <View style={styles.row}><Text style={styles.label}>Gross Revenue</Text><Text>{formatEur(s.boltGrossRevenue)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Platform Commission</Text><Text>-{formatEur(s.boltCommission)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Tips</Text><Text>{formatEur(s.boltTips)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Bonuses</Text><Text>{formatEur(s.boltBonuses)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Bolt Net</Text><Text style={styles.totalValue}>{formatEur(s.boltNetAmount)}</Text></View>
          </View>
        )}

        {/* Uber Section */}
        {s.uberGrossRevenue != null && Number(s.uberGrossRevenue) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uber</Text>
            <View style={styles.row}><Text style={styles.label}>Gross Revenue</Text><Text>{formatEur(s.uberGrossRevenue)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Service Fee</Text><Text>-{formatEur(s.uberServiceFee)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Tips</Text><Text>{formatEur(s.uberTips)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Uber Net</Text><Text style={styles.totalValue}>{formatEur(s.uberNetAmount)}</Text></View>
          </View>
        )}

        {/* FreeNow Section */}
        {s.freenowGrossRevenue != null && Number(s.freenowGrossRevenue) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FreeNow</Text>
            <View style={styles.row}><Text style={styles.label}>Gross Revenue</Text><Text>{formatEur(s.freenowGrossRevenue)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Commission</Text><Text>-{formatEur(s.freenowCommission)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Tips</Text><Text>{formatEur(s.freenowTips)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>FreeNow Net</Text><Text style={styles.totalValue}>{formatEur(s.freenowNetAmount)}</Text></View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Total Platform Net</Text><Text style={styles.value}>{formatEur(s.totalPlatformNet)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Partner Commission</Text><Text>-{formatEur(s.partnerCommissionAmount)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Vehicle Rental</Text><Text>-{formatEur(s.vehicleRentalDeduction)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Insurance</Text><Text>-{formatEur(s.insuranceDeduction)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fuel Costs</Text><Text>-{formatEur(s.fuelCostDeduction)}</Text></View>
          {s.lineItems && s.lineItems.length > 0 && (
            <>
              {s.lineItems.map((li, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.label}>{li.description}{li.isAutoApplied ? " (auto)" : ""}</Text>
                  <Text style={li.type === "BONUS" ? styles.positiveAmount : styles.negativeAmount}>
                    {li.type === "DEDUCTION" ? "-" : "+"}{formatEur(li.amount)}
                  </Text>
                </View>
              ))}
            </>
          )}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Driver Net Earnings</Text><Text style={styles.totalValue}>{formatEur(s.driverNetEarnings)}</Text></View>
        </View>

        {/* Cash & Payout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Reconciliation & Payout</Text>
          <View style={styles.row}><Text style={styles.label}>Cash Collected by Driver</Text><Text>{formatEur(s.cashCollectedByDriver)}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Payout Amount</Text>
            <Text style={Number(s.payoutAmount || 0) >= 0 ? styles.positiveAmount : styles.negativeAmount}>
              {formatEur(s.payoutAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{companyName} - Settlement generated on {new Date().toLocaleDateString("de-AT")}</Text>
        </View>
      </Page>
    </Document>
  );
}

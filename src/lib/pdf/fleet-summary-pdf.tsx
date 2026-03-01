import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: "Helvetica", orientation: "landscape" },
  header: { marginBottom: 15 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 10 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottomWidth: 1, borderBottomColor: "#d1d5db", paddingVertical: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 3 },
  totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: "#1f2937", paddingVertical: 4, backgroundColor: "#f9fafb" },
  colDriver: { width: "15%", paddingHorizontal: 2 },
  colPeriod: { width: "12%", paddingHorizontal: 2 },
  colStatus: { width: "8%", paddingHorizontal: 2 },
  colNum: { width: "9.3%", paddingHorizontal: 2, textAlign: "right" },
  headerText: { fontWeight: "bold", fontSize: 7 },
  totalText: { fontWeight: "bold" },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 7, color: "#999" },
});

function formatEur(val: number): string {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString("de-AT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-€${formatted}` : `€${formatted}`;
}

interface FleetSummaryRow {
  driverName: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalPlatformNet: number;
  partnerCommission: number;
  vehicleRental: number;
  lineItemsTotal: number;
  driverNetEarnings: number;
  cashCollected: number;
  payoutAmount: number;
}

interface FleetSummaryPDFProps {
  companyName: string;
  periodStart: string;
  periodEnd: string;
  rows: FleetSummaryRow[];
  totals: {
    totalPlatformNet: number;
    partnerCommission: number;
    vehicleRental: number;
    lineItemsTotal: number;
    driverNetEarnings: number;
    cashCollected: number;
    payoutAmount: number;
  };
}

export function FleetSummaryPDF({ companyName, periodStart, periodEnd, rows, totals }: FleetSummaryPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>
            Fleet Summary Report — {new Date(periodStart).toLocaleDateString("de-AT")} to{" "}
            {new Date(periodEnd).toLocaleDateString("de-AT")}
          </Text>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDriver}><Text style={styles.headerText}>Driver</Text></View>
            <View style={styles.colPeriod}><Text style={styles.headerText}>Period</Text></View>
            <View style={styles.colStatus}><Text style={styles.headerText}>Status</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Platform Net</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Commission</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Vehicle</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Line Items</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Driver Net</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Cash</Text></View>
            <View style={styles.colNum}><Text style={styles.headerText}>Payout</Text></View>
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDriver}><Text>{row.driverName}</Text></View>
              <View style={styles.colPeriod}>
                <Text>{new Date(row.periodStart).toLocaleDateString("de-AT")} - {new Date(row.periodEnd).toLocaleDateString("de-AT")}</Text>
              </View>
              <View style={styles.colStatus}><Text>{row.status}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.totalPlatformNet)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.partnerCommission)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.vehicleRental)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.lineItemsTotal)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.driverNetEarnings)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.cashCollected)}</Text></View>
              <View style={styles.colNum}><Text>{formatEur(row.payoutAmount)}</Text></View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalRow}>
            <View style={styles.colDriver}><Text style={styles.totalText}>TOTAL</Text></View>
            <View style={styles.colPeriod}><Text></Text></View>
            <View style={styles.colStatus}><Text></Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.totalPlatformNet)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.partnerCommission)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.vehicleRental)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.lineItemsTotal)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.driverNetEarnings)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.cashCollected)}</Text></View>
            <View style={styles.colNum}><Text style={styles.totalText}>{formatEur(totals.payoutAmount)}</Text></View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{companyName} - Fleet Summary generated on {new Date().toLocaleDateString("de-AT")}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * SEPA Credit Transfer XML Generator (pain.001.001.03)
 *
 * Generates valid XML for SEPA credit transfers that can be uploaded
 * to Austrian banking portals for batch payout processing.
 */

interface SepaPayment {
  endToEndId: string;
  creditorName: string;
  creditorIban: string;
  creditorBic?: string;
  amount: number;
  remittanceInfo: string;
}

interface SepaTransferInput {
  messageId: string;
  creationDateTime: string;
  numberOfTransactions: number;
  controlSum: number;
  initiatingPartyName: string;
  debtorName: string;
  debtorIban: string;
  debtorBic?: string;
  executionDate: string;
  payments: SepaPayment[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanSepaString(str: string): string {
  // SEPA only allows a limited character set
  return str.replace(/[^a-zA-Z0-9 .,\-+()/?:]/g, "").substring(0, 70);
}

export function generateSepaXml(input: SepaTransferInput): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
  );
  lines.push("  <CstmrCdtTrfInitn>");

  // Group Header
  lines.push("    <GrpHdr>");
  lines.push(`      <MsgId>${escapeXml(input.messageId)}</MsgId>`);
  lines.push(`      <CreDtTm>${input.creationDateTime}</CreDtTm>`);
  lines.push(`      <NbOfTxs>${input.numberOfTransactions}</NbOfTxs>`);
  lines.push(`      <CtrlSum>${input.controlSum.toFixed(2)}</CtrlSum>`);
  lines.push("      <InitgPty>");
  lines.push(`        <Nm>${escapeXml(cleanSepaString(input.initiatingPartyName))}</Nm>`);
  lines.push("      </InitgPty>");
  lines.push("    </GrpHdr>");

  // Payment Information
  lines.push("    <PmtInf>");
  lines.push(`      <PmtInfId>${escapeXml(input.messageId)}-PMT</PmtInfId>`);
  lines.push("      <PmtMtd>TRF</PmtMtd>");
  lines.push("      <BtchBookg>true</BtchBookg>");
  lines.push(`      <NbOfTxs>${input.numberOfTransactions}</NbOfTxs>`);
  lines.push(`      <CtrlSum>${input.controlSum.toFixed(2)}</CtrlSum>`);
  lines.push("      <PmtTpInf>");
  lines.push("        <SvcLvl>");
  lines.push("          <Cd>SEPA</Cd>");
  lines.push("        </SvcLvl>");
  lines.push("      </PmtTpInf>");
  lines.push(`      <ReqdExctnDt>${input.executionDate}</ReqdExctnDt>`);
  lines.push("      <Dbtr>");
  lines.push(`        <Nm>${escapeXml(cleanSepaString(input.debtorName))}</Nm>`);
  lines.push("      </Dbtr>");
  lines.push("      <DbtrAcct>");
  lines.push("        <Id>");
  lines.push(`          <IBAN>${input.debtorIban.replace(/\s/g, "").toUpperCase()}</IBAN>`);
  lines.push("        </Id>");
  lines.push("      </DbtrAcct>");
  lines.push("      <DbtrAgt>");
  lines.push("        <FinInstnId>");
  if (input.debtorBic) {
    lines.push(`          <BIC>${input.debtorBic}</BIC>`);
  } else {
    lines.push("          <Othr><Id>NOTPROVIDED</Id></Othr>");
  }
  lines.push("        </FinInstnId>");
  lines.push("      </DbtrAgt>");
  lines.push("      <ChrgBr>SLEV</ChrgBr>");

  // Individual Transactions
  for (const payment of input.payments) {
    lines.push("      <CdtTrfTxInf>");
    lines.push("        <PmtId>");
    lines.push(`          <EndToEndId>${escapeXml(payment.endToEndId)}</EndToEndId>`);
    lines.push("        </PmtId>");
    lines.push("        <Amt>");
    lines.push(
      `          <InstdAmt Ccy="EUR">${payment.amount.toFixed(2)}</InstdAmt>`
    );
    lines.push("        </Amt>");
    lines.push("        <CdtrAgt>");
    lines.push("          <FinInstnId>");
    if (payment.creditorBic) {
      lines.push(`            <BIC>${payment.creditorBic}</BIC>`);
    } else {
      lines.push("            <Othr><Id>NOTPROVIDED</Id></Othr>");
    }
    lines.push("          </FinInstnId>");
    lines.push("        </CdtrAgt>");
    lines.push("        <Cdtr>");
    lines.push(`          <Nm>${escapeXml(cleanSepaString(payment.creditorName))}</Nm>`);
    lines.push("        </Cdtr>");
    lines.push("        <CdtrAcct>");
    lines.push("          <Id>");
    lines.push(`            <IBAN>${payment.creditorIban.replace(/\s/g, "").toUpperCase()}</IBAN>`);
    lines.push("          </Id>");
    lines.push("        </CdtrAcct>");
    lines.push("        <RmtInf>");
    lines.push(`          <Ustrd>${escapeXml(cleanSepaString(payment.remittanceInfo))}</Ustrd>`);
    lines.push("        </RmtInf>");
    lines.push("      </CdtTrfTxInf>");
  }

  lines.push("    </PmtInf>");
  lines.push("  </CstmrCdtTrfInitn>");
  lines.push("</Document>");

  return lines.join("\n");
}

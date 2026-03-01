"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { formatEur } from "@/lib/format";

export function BalanceWidget({ balance }: { balance: number }) {
  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Kontostand
        </CardTitle>
        <Wallet className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-bold ${
            balance >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatEur(balance)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Current account balance
        </p>
      </CardContent>
    </Card>
  );
}

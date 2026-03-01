"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEur, formatEurShort } from "@/lib/format";

interface WeeklyIncome {
  week: string;
  bolt: number;
  uber: number;
  freenow: number;
}

export function IncomeChart({ data }: { data: WeeklyIncome[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Einkommensübersicht (8 Wochen)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-500">
            Noch keine Einkommensdaten vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Einkommensübersicht (8 Wochen)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatEurShort} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatEur(Number(value))}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Legend />
            <Bar
              dataKey="bolt"
              name="Bolt"
              fill="#34d399"
              radius={[2, 2, 0, 0]}
              stackId="income"
            />
            <Bar
              dataKey="uber"
              name="Uber"
              fill="#1f2937"
              radius={[2, 2, 0, 0]}
              stackId="income"
            />
            <Bar
              dataKey="freenow"
              name="FreeNow"
              fill="#ef4444"
              radius={[2, 2, 0, 0]}
              stackId="income"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

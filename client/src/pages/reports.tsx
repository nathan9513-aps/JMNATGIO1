import TimeReports from "@/components/reports/time-reports";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Time Reports</h2>
      <p className="text-muted-foreground">
        Analyze your time tracking data with detailed reports and insights.
      </p>
      <TimeReports />
    </div>
  );
}

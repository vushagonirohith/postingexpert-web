export function PlatformStats() {
  const platforms = [
    { name: "Instagram", value: "↑ 22%" },
    { name: "LinkedIn", value: "↑ 15%" },
    { name: "X", value: "↑ 10%" },
    { name: "Facebook", value: "↑ 8%" },
  ];
 
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-foreground">
        Platform performance
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Engagement change (7 days)
      </p>

      <div className="mt-6 space-y-4">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RightPanel() {
    return (
      <aside className="h-screen bg-background border-l px-4 py-6 space-y-6 overflow-y-auto">
        <div className="rounded-xl border p-4">
          <h4 className="font-semibold mb-1">📅 Today</h4>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
  
        <div className="rounded-xl border p-4">
          <h4 className="font-semibold mb-2">🧠 OR Notes</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Femoral rotation check</li>
            <li>• Trial balancing</li>
            <li>• Cement timing</li>
          </ul>
        </div>
      </aside>
    );
  }
  
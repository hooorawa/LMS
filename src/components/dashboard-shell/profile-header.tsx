export function formatRole(role: string) {
  return role
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileHeader({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8.5 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
        {initials(name)}
      </div>
      <div className="hidden sm:block">
        <div className="text-[13px] font-semibold text-foreground">{name}</div>
        <div className="text-[11.5px] text-muted-foreground">{formatRole(role)}</div>
      </div>
    </div>
  );
}

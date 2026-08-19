"use client";

import LogOutBtn from "@/components/logout-btn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "";
  }

  const firstInitial = parts[0]?.[0] ?? "";
  const lastInitial = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function UserNavIndicator({ name, email }: { name: string; email: string }) {
  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground"
        aria-label="Menu do usuário"
      >
        {initials}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex flex-col gap-0.5 px-2 py-1.5 text-left text-sm">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<LogOutBtn />} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

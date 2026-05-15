import {
  User, CheckCircle2, XCircle, FileText, AlertTriangle, Bell, ClipboardList,
} from "lucide-react";
import type { NotificationMeta } from "@/lib/notifications/types";

type Color = NotificationMeta["color"];
type Icon  = NotificationMeta["icon"];

const ICON_MAP: Record<Icon, React.ElementType> = {
  user:  User,
  check: CheckCircle2,
  x:     XCircle,
  file:  FileText,
  bid:   ClipboardList,
  alert: AlertTriangle,
  bell:  Bell,
};

const COLOR_MAP: Record<Color, { bg: string; text: string }> = {
  blue:  { bg: "bg-blue-100",   text: "text-blue-600"   },
  green: { bg: "bg-green-100",  text: "text-green-600"  },
  red:   { bg: "bg-red-100",    text: "text-red-600"    },
  amber: { bg: "bg-amber-100",  text: "text-amber-600"  },
  slate: { bg: "bg-slate-100",  text: "text-slate-500"  },
};

interface Props {
  icon: Icon;
  color: Color;
  size?: "sm" | "md";
}

export function NotificationIcon({ icon, color, size = "md" }: Props) {
  const IconComp = ICON_MAP[icon];
  const { bg, text } = COLOR_MAP[color];
  const ring = size === "sm" ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl";
  const ico  = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  return (
    <div className={`${ring} ${bg} flex items-center justify-center shrink-0`}>
      <IconComp className={`${ico} ${text}`} />
    </div>
  );
}

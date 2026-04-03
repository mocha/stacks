import Link from "next/link";
import { starColorClass } from "@/lib/stars";

interface StackCardProps {
  acronym: string;
  summary?: string | null;
  attribution?: string | null;
  totalStars?: number;
}

export function StackCard({ acronym, summary, attribution, totalStars = 0 }: StackCardProps) {
  return (
    <Link href={`/s/${acronym}`} className="block">
      <div className="rounded-lg border border-zinc-950/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            {acronym}
          </span>
          {totalStars > 0 && (
            <span className={`text-xs ${starColorClass(totalStars)}`}>
              ★ {totalStars.toLocaleString()}
            </span>
          )}
        </div>
        {summary && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{summary}</p>
        )}
        {attribution && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{attribution}</p>
        )}
      </div>
    </Link>
  );
}

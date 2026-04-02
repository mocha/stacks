"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/catalyst/heading";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Divider } from "@/components/catalyst/divider";

interface Technology {
  id: string;
  name: string;
  vendor: string | null;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  githubStars: number;
}

interface TechEntry {
  query: string;
  selected: Technology | null;
  isUnknown: boolean; // kept for backward compat
  isNew: boolean;
}

interface UniquenessResult {
  available: boolean;
  existingStack?: { acronym: string; creator: string };
}

export default function BuildPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TechEntry[]>([
    { query: "", selected: null, isUnknown: false, isNew: false },
  ]);
  const [suggestions, setSuggestions] = useState<Technology[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [uniqueness, setUniqueness] = useState<UniquenessResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTechUrls, setNewTechUrls] = useState<Record<string, string>>({});

  const acronym = entries
    .filter((e) => e.selected || e.isNew || e.query.trim())
    .map((e) => {
      const name = e.selected?.name ?? e.query;
      return name[0]?.toUpperCase() ?? "";
    })
    .join("");

  const newEntries = entries.filter((e) => e.isNew);

  useEffect(() => {
    if (acronym.length < 2) {
      setUniqueness(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const res = await fetch(
        `/api/stacks/check?acronym=${encodeURIComponent(acronym)}`
      );
      const data = await res.json();
      setUniqueness(data);
    }, 300);

    return () => clearTimeout(timeout);
  }, [acronym]);

  const searchTechnologies = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `/api/technologies?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSuggestions(data);
  }, []);

  const updateEntry = (index: number, query: string) => {
    const updated = [...entries];
    updated[index] = { query, selected: null, isUnknown: false, isNew: false };
    setEntries(updated);
    setActiveLine(index);
    searchTechnologies(query);

    // Clean up URL for this entry if it was previously new
    const oldQuery = entries[index].query;
    if (oldQuery && newTechUrls[oldQuery]) {
      const urls = { ...newTechUrls };
      delete urls[oldQuery];
      setNewTechUrls(urls);
    }
  };

  const selectTechnology = (index: number, tech: Technology) => {
    const updated = [...entries];
    updated[index] = { query: tech.name, selected: tech, isUnknown: false, isNew: false };
    setEntries(updated);
    setSuggestions([]);
  };

  const addLine = () => {
    setEntries([...entries, { query: "", selected: null, isUnknown: false, isNew: false }]);
    setActiveLine(entries.length);
  };

  const removeLine = (index: number) => {
    if (entries.length <= 1) return;
    const entry = entries[index];
    if (entry.isNew && newTechUrls[entry.query]) {
      const urls = { ...newTechUrls };
      delete urls[entry.query];
      setNewTechUrls(urls);
    }
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  const markNewIfNeeded = (index: number) => {
    const entry = entries[index];
    if (entry.query && !entry.selected && !entry.isNew) {
      const updated = [...entries];
      updated[index] = { ...entry, isUnknown: false, isNew: true };
      setEntries(updated);
    }
  };

  const handleBlur = (index: number) => {
    // When user leaves the field, mark unmatched text as a new technology
    markNewIfNeeded(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "+") {
      e.preventDefault();

      markNewIfNeeded(index);

      addLine();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Create new technologies first
      const createdTechIds: string[] = [];
      for (const entry of newEntries) {
        const url = newTechUrls[entry.query];
        if (!url) {
          setError(`Please provide a GitHub URL for "${entry.query}".`);
          setSaving(false);
          return;
        }

        const res = await fetch("/api/technologies/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: entry.query, githubUrl: url }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || `Failed to create technology "${entry.query}".`);
          setSaving(false);
          return;
        }

        createdTechIds.push(data.technology.id);
      }

      // Collect all technology IDs: existing selected + newly created
      const existingIds = entries
        .filter((e) => e.selected)
        .map((e) => e.selected!.id);

      const technologyIds = [...existingIds, ...createdTechIds];

      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acronym, technologyIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      router.push(data.redirect);
    } catch {
      setError("Something went wrong. Try again.");
      setSaving(false);
    }
  };

  const selectedIds = entries.filter((e) => e.selected).map((e) => e.selected!.id);
  const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;

  // All new techs must have URLs provided
  const allNewTechsHaveUrls = newEntries.every(
    (e) => newTechUrls[e.query]?.trim()
  );

  const canSave =
    acronym.length >= 2 &&
    uniqueness?.available &&
    entries.filter((e) => e.selected || e.isNew).length >= 2 &&
    entries.every((e) => e.selected || e.isNew || !e.query) &&
    !hasDuplicates &&
    allNewTechsHaveUrls;

  return (
    <div>
      <Heading className="!text-3xl sm:!text-4xl">
        {acronym ? `The ${acronym} Stack!` : "Design my Stack"}
      </Heading>

      {uniqueness && (
        <div className="mt-3">
          {uniqueness.available ? (
            <Badge color="green">Available!</Badge>
          ) : (
            <Badge color="red">
              Taken by{" "}
              <a
                href={`/s/${uniqueness.existingStack?.acronym}`}
                className="underline"
              >
                @{uniqueness.existingStack?.creator}
              </a>
            </Badge>
          )}
        </div>
      )}

      <Divider className="my-6" soft />

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={entry.query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEntry(index, e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                  onFocus={() => setActiveLine(index)}
                  onBlur={() => handleBlur(index)}
                  placeholder="Type a technology name..."
                  autoFocus={index === activeLine}
                  autoComplete="off"
                />
              </div>
              {entry.selected && (
                <Badge color="blue">{entry.selected.name[0]}</Badge>
              )}
              {entry.isNew && (
                <Badge color="lime">New!</Badge>
              )}
              {entries.length > 1 && (
                <Button plain onClick={() => removeLine(index)} className="text-zinc-400 hover:text-zinc-600">
                  <span aria-hidden="true">&times;</span>
                </Button>
              )}
            </div>

            {activeLine === index && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.filter((tech) => !entries.some((e, i) => i !== index && e.selected?.id === tech.id)).map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => selectTechnology(index, tech)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="font-medium">{tech.name}</span>
                    {tech.vendor && (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {" "}by {tech.vendor}
                      </span>
                    )}
                    {tech.description && (
                      <span className="text-zinc-500 dark:text-zinc-400 block text-xs mt-0.5 truncate">
                        {tech.description.slice(0, 80)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <Button plain onClick={addLine}>
          + Add technology
        </Button>
      </div>

      {/* New technology URL forms */}
      {newEntries.length > 0 && (
        <div className="mt-6 rounded-lg bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800 p-4">
          <p className="text-sm font-medium text-lime-800 dark:text-lime-300 mb-3">
            You&apos;re adding new technologies! We&apos;ll need a GitHub URL for each one.
          </p>
          <div className="space-y-6">
            {newEntries.map((entry) => (
              <Field key={entry.query}>
                <Label><span className="font-semibold">{entry.query}:</span></Label>
                <Input
                  type="url"
                  value={newTechUrls[entry.query] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTechUrls({
                      ...newTechUrls,
                      [entry.query]: e.target.value,
                    })
                  }
                  placeholder="https://github.com/org/repo"
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-8">
        <Button
          color="blue"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? "Inventing..." : "Invent this Stack"}
        </Button>
      </div>
    </div>
  );
}

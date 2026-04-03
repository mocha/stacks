"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/catalyst/heading";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Divider } from "@/components/catalyst/divider";

const SEPARATOR_OPTIONS = ["-", "_", "*", "/", ":"];

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
  isUnknown: boolean;
  isNew: boolean;
  isSeparator: boolean;
  separatorChar: string;
}

interface UniquenessResult {
  available: boolean;
  existingStack?: { acronym: string; creator: string };
}

const emptyEntry = (): TechEntry => ({ query: "", selected: null, isUnknown: false, isNew: false, isSeparator: false, separatorChar: "-" });
const separatorEntry = (char = "-"): TechEntry => ({ query: char, selected: null, isUnknown: false, isNew: false, isSeparator: true, separatorChar: char });

export default function BuildPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TechEntry[]>([emptyEntry()]);
  const [suggestions, setSuggestions] = useState<Technology[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [uniqueness, setUniqueness] = useState<UniquenessResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTechUrls, setNewTechUrls] = useState<Record<string, string>>({});
  const [showSeparatorPicker, setShowSeparatorPicker] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const acronym = entries
    .filter((e) => e.selected || e.isNew || e.isSeparator || e.query.trim())
    .map((e) => {
      if (e.isSeparator) return e.separatorChar;
      const name = e.selected?.name ?? e.query;
      return name[0]?.toUpperCase() ?? "";
    })
    .join("");

  const newEntries = entries.filter((e) => e.isNew && !e.isSeparator);

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
    updated[index] = { query, selected: null, isUnknown: false, isNew: false, isSeparator: false, separatorChar: "-" };
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
    updated[index] = { query: tech.name, selected: tech, isUnknown: false, isNew: false, isSeparator: false, separatorChar: "-" };
    setEntries(updated);
    setSuggestions([]);
  };

  const addLine = () => {
    setEntries([...entries, emptyEntry()]);
    setActiveLine(entries.length);
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  // dropTargetIndex represents the gap BEFORE that index (insert position)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? index : index + 1;
    setDropTargetIndex(insertIndex);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAt = e.clientY < midY ? index : index + 1;
    setDropTargetIndex(null);
    if (from === null) return;
    const updated = [...entries];
    const [dragged] = updated.splice(from, 1);
    const adjustedInsert = insertAt > from ? insertAt - 1 : insertAt;
    updated.splice(adjustedInsert, 0, dragged);
    setEntries(updated);
    dragIndexRef.current = null;
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
    if (entry.isSeparator) return;
    if (entry.query && !entry.selected && !entry.isNew) {
      // Check if user typed just a dash — make it a separator
      if (entry.query.trim() === "-") {
        const updated = [...entries];
        updated[index] = { ...entry, isSeparator: true, isNew: false, separatorChar: "-" };
        setEntries(updated);
        return;
      }
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

      // Use functional update to avoid stale closure — markNewIfNeeded
      // and addLine both need to see the latest entries state
      setEntries((prev) => {
        const updated = [...prev];
        const entry = updated[index];
        if (!entry.isSeparator && entry.query && !entry.selected && !entry.isNew) {
          if (entry.query.trim() === "-") {
            updated[index] = { ...entry, isSeparator: true, isNew: false, separatorChar: "-" };
          } else {
            updated[index] = { ...entry, isUnknown: false, isNew: true };
          }
        }
        // Add new empty line
        updated.push(emptyEntry());
        return updated;
      });
      setActiveLine(entries.length);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Create new technologies first, building a map of name -> id
      const newTechIdMap: Record<string, string> = {};
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

        newTechIdMap[entry.query] = data.technology.id;
      }

      // Build ordered technology IDs, skipping separators
      const technologyIds: string[] = [];
      for (const entry of entries) {
        if (entry.isSeparator) continue;
        if (entry.selected) {
          technologyIds.push(entry.selected.id);
        } else if (entry.isNew && newTechIdMap[entry.query]) {
          technologyIds.push(newTechIdMap[entry.query]);
        }
      }

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
    entries.every((e) => e.selected || e.isNew || e.isSeparator || !e.query) &&
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

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={index}>
            {/* Drop indicator above this item */}
            {dropTargetIndex === index && dragIndexRef.current !== index && dragIndexRef.current !== index - 1 && (
              <div className="h-1 rounded-full bg-blue-500 dark:bg-blue-400 mb-2 mx-8" />
            )}
            <div
              className="relative flex items-center gap-2"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
            {/* Drag handle */}
            <span className="cursor-grab text-zinc-300 dark:text-zinc-600 select-none text-lg leading-none px-1" title="Drag to reorder">⠿</span>

            {entry.isSeparator ? (
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-zinc-950/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 flex-1">
                  <span className="text-2xl font-black text-zinc-400 dark:text-zinc-500 mr-2">{entry.separatorChar}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-3">separator</span>
                  {SEPARATOR_OPTIONS.map((char) => (
                    <button
                      key={char}
                      onClick={() => {
                        const updated = [...entries];
                        updated[index] = { ...entry, separatorChar: char, query: char };
                        setEntries(updated);
                      }}
                      className={`px-2 py-0.5 rounded text-sm font-mono border transition-colors ${
                        entry.separatorChar === char
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white"
                          : "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500"
                      }`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
                {entries.length > 1 && (
                  <Button plain onClick={() => removeLine(index)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                    <span aria-hidden="true">&times;</span>
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Letter + input fused together */}
                <div className="flex-1 relative flex rounded-lg border border-zinc-950/10 dark:border-white/10 focus-within:border-zinc-950/30 dark:focus-within:border-white/30 overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-center px-4 min-w-[3rem] bg-blue-600 dark:bg-blue-500 border-r border-blue-700 dark:border-blue-600 shrink-0 self-stretch">
                    <span className="text-2xl font-black text-white leading-none">
                      {(entry.selected?.name ?? entry.query)?.[0]?.toUpperCase() ?? "·"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={entry.query}
                    onChange={(e) => updateEntry(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setActiveLine(index)}
                    onBlur={() => handleBlur(index)}
                    placeholder="Type a technology name..."
                    autoFocus={index === activeLine}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-form-type="other"
                    className="flex-1 px-4 py-3 text-xl font-semibold bg-transparent outline-none text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                  {entry.isNew && (
                    <div className="flex items-center pr-3">
                      <Badge color="lime">New!</Badge>
                    </div>
                  )}
                </div>

                {entries.length > 1 && (
                  <Button plain onClick={() => removeLine(index)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                    <span aria-hidden="true">&times;</span>
                  </Button>
                )}

                {activeLine === index && suggestions.length > 0 && (
                  <div className="absolute left-10 right-10 z-10 top-full mt-1 rounded-lg border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.filter((tech) => !entries.some((e, i) => i !== index && e.selected?.id === tech.id)).map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => selectTechnology(index, tech)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <span className="font-medium">{tech.name}</span>
                        {tech.vendor && (
                          <span className="text-zinc-400 dark:text-zinc-500"> by {tech.vendor}</span>
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
              </>
            )}
            </div>
          </div>
        ))}

        {/* Drop indicator after the last item */}
        {dropTargetIndex === entries.length && (
          <div className="h-1 rounded-full bg-blue-500 dark:bg-blue-400 mx-8" />
        )}

        <div className="flex items-center gap-4 pt-2">
          <Button plain onClick={addLine}>+ Add technology</Button>
          <div className="relative">
            <Button plain onClick={() => setShowSeparatorPicker((v) => !v)}>+ Add separator</Button>
            {showSeparatorPicker && (
              <div className="absolute top-full mt-1 left-0 z-10 flex items-center gap-1 rounded-lg border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg p-2">
                {SEPARATOR_OPTIONS.map((char) => (
                  <button
                    key={char}
                    onClick={() => {
                      setEntries([...entries, separatorEntry(char)]);
                      setShowSeparatorPicker(false);
                    }}
                    className="px-3 py-1.5 rounded font-mono text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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

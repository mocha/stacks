"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Divider } from "@/components/catalyst/divider";

interface Technology {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  githubStars: number;
}

interface TechEntry {
  query: string;
  selected: Technology | null;
  isUnknown: boolean;
}

interface UniquenessResult {
  available: boolean;
  existingStack?: { acronym: string; creator: string };
}

export default function BuildPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TechEntry[]>([
    { query: "", selected: null, isUnknown: false },
  ]);
  const [suggestions, setSuggestions] = useState<Technology[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [uniqueness, setUniqueness] = useState<UniquenessResult | null>(null);
  const [questionnaire, setQuestionnaire] = useState({
    industries: "",
    notableFeature: "",
    competitor: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  // Build acronym from selected technologies
  const acronym = entries
    .filter((e) => e.selected || e.isUnknown)
    .map((e) => {
      const name = e.selected?.name ?? e.query;
      return name[0]?.toUpperCase() ?? "";
    })
    .join("");

  // Check acronym uniqueness (debounced)
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

  // Search technologies as user types
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
    const newEntries = [...entries];
    newEntries[index] = { query, selected: null, isUnknown: false };
    setEntries(newEntries);
    setActiveLine(index);
    searchTechnologies(query);
  };

  const selectTechnology = (index: number, tech: Technology) => {
    const newEntries = [...entries];
    newEntries[index] = { query: tech.name, selected: tech, isUnknown: false };
    setEntries(newEntries);
    setSuggestions([]);
  };

  const addLine = () => {
    setEntries([...entries, { query: "", selected: null, isUnknown: false }]);
    setActiveLine(entries.length);
  };

  const removeLine = (index: number) => {
    if (entries.length <= 1) return;
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "+") {
      e.preventDefault();

      const entry = entries[index];
      if (entry.query && !entry.selected) {
        const newEntries = [...entries];
        newEntries[index] = { ...entry, isUnknown: true };
        setEntries(newEntries);
      }

      addLine();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const unknowns = entries.filter((e) => e.isUnknown);
    if (unknowns.length > 0) {
      setError(
        `Unknown technologies: ${unknowns.map((e) => e.query).join(", ")}. Please select from the list or suggest them first.`
      );
      setSaving(false);
      return;
    }

    const technologyIds = entries
      .filter((e) => e.selected)
      .map((e) => e.selected!.id);

    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acronym, technologyIds, questionnaire }),
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

  const canSave =
    acronym.length >= 2 &&
    uniqueness?.available &&
    entries.every((e) => e.selected) &&
    questionnaire.industries &&
    questionnaire.notableFeature &&
    questionnaire.competitor;

  if (isAuthenticated === null) {
    return (
      <div className="py-16 text-center">
        <Text>Loading...</Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 text-center">
        <Heading>Design my Stack</Heading>
        <Text className="mt-4">You need to sign in to invent your stack.</Text>
        <div className="mt-6">
          <Button href="/" color="blue">Go sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Live heading */}
      <Heading className="!text-3xl sm:!text-4xl">
        {acronym ? `The ${acronym} Stack!` : "Design my Stack"}
      </Heading>

      {/* Availability badge */}
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

      {/* Technology entries */}
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
                  placeholder="Type a technology name..."
                  autoFocus={index === activeLine}
                />
              </div>
              {entry.selected && (
                <Badge color="blue">{entry.selected.name[0]}</Badge>
              )}
              {entries.length > 1 && (
                <Button plain onClick={() => removeLine(index)} className="text-zinc-400 hover:text-zinc-600">
                  <span aria-hidden="true">&times;</span>
                </Button>
              )}
            </div>

            {/* Typeahead dropdown */}
            {activeLine === index && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => selectTechnology(index, tech)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="font-medium">{tech.name}</span>
                    {tech.description && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {" "}&mdash; {tech.description.slice(0, 60)}
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

      <Divider className="my-6" soft />

      {/* Questionnaire */}
      <div>
        <Subheading className="mb-6">Tell us about your stack</Subheading>
        <div className="space-y-6">
          <Field>
            <Label>What industries primarily use this stack?</Label>
            <Input
              type="text"
              value={questionnaire.industries}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuestionnaire({ ...questionnaire, industries: e.target.value })
              }
            />
          </Field>
          <Field>
            <Label>What is its most notable feature?</Label>
            <Input
              type="text"
              value={questionnaire.notableFeature}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuestionnaire({
                  ...questionnaire,
                  notableFeature: e.target.value,
                })
              }
            />
          </Field>
          <Field>
            <Label>What is its biggest competitor?</Label>
            <Input
              type="text"
              value={questionnaire.competitor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuestionnaire({
                  ...questionnaire,
                  competitor: e.target.value,
                })
              }
            />
          </Field>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit */}
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

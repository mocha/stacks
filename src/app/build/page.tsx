"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  return (
    <main>
      <h1>
        {acronym ? `The ${acronym} Stack!` : "Design my Stack"}
      </h1>

      {uniqueness && (
        <div>
          {uniqueness.available ? (
            <span>Available!</span>
          ) : (
            <span>
              Taken by{" "}
              <a href={`/s/${uniqueness.existingStack?.acronym}`}>
                @{uniqueness.existingStack?.creator}
              </a>
            </span>
          )}
        </div>
      )}

      <div>
        {entries.map((entry, index) => (
          <div key={index}>
            <input
              type="text"
              value={entry.query}
              onChange={(e) => updateEntry(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setActiveLine(index)}
              placeholder="Type a technology name..."
              autoFocus={index === activeLine}
            />
            {entry.selected && <span>{entry.selected.name[0]}</span>}
            {entries.length > 1 && (
              <button onClick={() => removeLine(index)}>x</button>
            )}

            {activeLine === index && suggestions.length > 0 && (
              <ul>
                {suggestions.map((tech) => (
                  <li key={tech.id}>
                    <button onClick={() => selectTechnology(index, tech)}>
                      {tech.name}
                      {tech.description && (
                        <span> — {tech.description.slice(0, 60)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <button onClick={addLine}>+ Add technology</button>
      </div>

      <div>
        <h2>Tell us about your stack</h2>
        <label>
          What industries primarily use this stack?
          <input
            type="text"
            value={questionnaire.industries}
            onChange={(e) =>
              setQuestionnaire({ ...questionnaire, industries: e.target.value })
            }
          />
        </label>
        <label>
          What is its most notable feature?
          <input
            type="text"
            value={questionnaire.notableFeature}
            onChange={(e) =>
              setQuestionnaire({
                ...questionnaire,
                notableFeature: e.target.value,
              })
            }
          />
        </label>
        <label>
          What is its biggest competitor?
          <input
            type="text"
            value={questionnaire.competitor}
            onChange={(e) =>
              setQuestionnaire({
                ...questionnaire,
                competitor: e.target.value,
              })
            }
          />
        </label>
      </div>

      {error && <p>{error}</p>}

      <button onClick={handleSave} disabled={!canSave || saving}>
        {saving ? "Inventing..." : "Invent this Stack"}
      </button>
    </main>
  );
}

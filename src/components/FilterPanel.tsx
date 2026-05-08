import { X } from "lucide-react";
import {
  DEFAULT_FILTERS,
  toggleDifficulty,
  toggleTheme
} from "../lib/filters";
import type { PuzzleDifficulty, PuzzleFilters } from "../types";

interface FilterPanelProps {
  filters: PuzzleFilters;
  themes: string[];
  open: boolean;
  onChange: (filters: PuzzleFilters) => void;
  onClose: () => void;
}

const difficulties: PuzzleDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

export default function FilterPanel({
  filters,
  themes,
  open,
  onChange,
  onClose
}: FilterPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="filter-panel filter-panel--open"
    >
      <div className="filter-panel__sheet" role="dialog" aria-modal="true" aria-label="Puzzle filters">
        <header className="filter-panel__header">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Shape the feed</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close filters">
            <X aria-hidden="true" />
          </button>
        </header>

        <section className="filter-group" aria-labelledby="difficulty-heading">
          <h3 id="difficulty-heading">Difficulty</h3>
          <div className="chip-grid">
            {difficulties.map((difficulty) => (
              <label key={difficulty} className="filter-chip">
                <input
                  type="checkbox"
                  checked={filters.difficulties.includes(difficulty)}
                  onChange={() => onChange(toggleDifficulty(filters, difficulty))}
                />
                <span>{difficulty}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="filter-group" aria-labelledby="theme-heading">
          <h3 id="theme-heading">Themes</h3>
          <div className="chip-grid">
            {themes.map((theme) => (
              <label key={theme} className="filter-chip">
                <input
                  type="checkbox"
                  checked={filters.themes.includes(theme)}
                  onChange={() => onChange(toggleTheme(filters, theme))}
                />
                <span>{theme}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="filter-group" aria-labelledby="rating-heading">
          <h3 id="rating-heading">Max rating</h3>
          <label className="rating-range">
            <input
              type="range"
              min="500"
              max="2200"
              step="50"
              value={filters.ratingMax}
              onChange={(event) =>
                onChange({
                  ...filters,
                  ratingMax: Number(event.target.value)
                })
              }
            />
            <strong>{filters.ratingMax}</strong>
          </label>
        </section>

        <div className="filter-panel__actions">
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)}>
            Reset
          </button>
          <button type="button" className="primary-button" onClick={onClose}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

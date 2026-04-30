import React, { useMemo, useEffect } from "react";
import { Country, State, City } from "country-state-city";

/**
 * Cascading country → state → city selects.
 * Props:
 *  - value: { country, state, city } (ISO codes for country/state, string for city)
 *  - onChange: (next) => void
 *  - labels: { country, state, city }
 */
const LocationSelect = ({ value, onChange, labels, required = true, className = "" }) => {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(
    () => (value.country ? State.getStatesOfCountry(value.country) : []),
    [value.country]
  );
  const cities = useMemo(
    () => (value.country && value.state ? City.getCitiesOfState(value.country, value.state) : []),
    [value.country, value.state]
  );

  // Reset child selects when parent changes and child no longer valid
  useEffect(() => {
    if (value.state && !states.find((s) => s.isoCode === value.state)) {
      onChange({ ...value, state: "", city: "" });
    }
  // eslint-disable-next-line
  }, [value.country]);
  useEffect(() => {
    if (value.city && !cities.find((c) => c.name === value.city)) {
      onChange({ ...value, city: "" });
    }
  // eslint-disable-next-line
  }, [value.state]);

  const setCountry = (c) => onChange({ country: c, state: "", city: "" });
  const setState = (s) => onChange({ ...value, state: s, city: "" });
  const setCity = (c) => onChange({ ...value, city: c });

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-teal">{labels.country}</label>
        <select
          required={required}
          value={value.country}
          onChange={(e) => setCountry(e.target.value)}
          className="field-input mt-1"
          data-testid="loc-country"
        >
          <option value="">—</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-teal">{labels.state}</label>
        <select
          required={required && states.length > 0}
          value={value.state}
          onChange={(e) => setState(e.target.value)}
          disabled={!value.country}
          className="field-input mt-1 disabled:bg-gray-50 disabled:text-gray-400"
          data-testid="loc-state"
        >
          <option value="">—</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-teal">{labels.city}</label>
        {cities.length > 0 ? (
          <select
            required={required}
            value={value.city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!value.state}
            className="field-input mt-1 disabled:bg-gray-50 disabled:text-gray-400"
            data-testid="loc-city"
          >
            <option value="">—</option>
            {cities.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
          </select>
        ) : (
          <input
            required={required}
            value={value.city}
            onChange={(e) => setCity(e.target.value)}
            className="field-input mt-1"
            placeholder="—"
            data-testid="loc-city"
          />
        )}
      </div>
    </div>
  );
};

export default LocationSelect;

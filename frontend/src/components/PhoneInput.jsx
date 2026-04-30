import React, { useMemo } from "react";
import { Country } from "country-state-city";

const PRIORITY_COUNTRY_CODES = ["US", "CO", "MX", "HN", "SV"];

/**
 * Phone input with country dial code selector.
 * Default country: US. Priority countries shown first, then full list.
 */
const PhoneInput = ({ value, onChange, label, required = true }) => {
  const allCountries = useMemo(() => {
    return Country.getAllCountries()
      .filter((c) => c.phonecode)
      .map((c) => ({
        code: c.isoCode,
        name: c.name,
        flag: c.flag,
        dial: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
      }));
  }, []);

  const { priority, rest } = useMemo(() => {
    const priority = PRIORITY_COUNTRY_CODES
      .map((code) => allCountries.find((c) => c.code === code))
      .filter(Boolean);
    const rest = allCountries
      .filter((c) => !PRIORITY_COUNTRY_CODES.includes(c.code))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { priority, rest };
  }, [allCountries]);

  // Use country code (not dial) for unique selection — multiple countries share +1
  const currentCode = value.country || "US";

  const handleChange = (code) => {
    const c = allCountries.find((x) => x.code === code);
    if (c) onChange({ ...value, country: c.code, dialCode: c.dial });
  };

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-teal">{label}</label>
      <div className="flex gap-2 mt-1">
        <select
          value={currentCode}
          onChange={(e) => handleChange(e.target.value)}
          className="field-input max-w-[170px] bg-white"
          data-testid="phone-dial-code"
          aria-label="Dial code"
        >
          <optgroup label="——">
            {priority.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.dial} {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="———">
            {rest.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.dial} {c.name}
              </option>
            ))}
          </optgroup>
        </select>
        <input
          required={required}
          type="tel"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d\s-]/g, "") })}
          className="field-input flex-1"
          placeholder="300 000 0000"
          data-testid="phone-number"
        />
      </div>
    </div>
  );
};

export default PhoneInput;

import React, { useMemo } from "react";
import { Country } from "country-state-city";

/**
 * Phone input with country dial code selector.
 * Props:
 *  - value: { dialCode: "+1", number: "432..." }
 *  - onChange: (next) => void
 *  - label, required
 */
const PhoneInput = ({ value, onChange, label, required = true, defaultCountry = "US" }) => {
  const countries = useMemo(() => {
    return Country.getAllCountries()
      .filter((c) => c.phonecode)
      .map((c) => ({
        code: c.isoCode,
        name: c.name,
        flag: c.flag,
        dial: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Fall back to default dial code if not set
  const defaultCountryEntry = useMemo(
    () => countries.find((c) => c.code === defaultCountry) || countries.find((c) => c.dial === "+1"),
    [countries, defaultCountry]
  );

  const currentDial = value.dialCode || defaultCountryEntry?.dial || "+1";

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-teal">{label}</label>
      <div className="flex gap-2 mt-1">
        <select
          value={currentDial}
          onChange={(e) => onChange({ ...value, dialCode: e.target.value })}
          className="field-input max-w-[140px] bg-white"
          data-testid="phone-dial-code"
          aria-label="Dial code"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial} {c.name}
            </option>
          ))}
        </select>
        <input
          required={required}
          type="tel"
          value={value.number}
          onChange={(e) => onChange({ ...value, dialCode: currentDial, number: e.target.value.replace(/[^\d\s-]/g, "") })}
          className="field-input flex-1"
          placeholder="300 000 0000"
          data-testid="phone-number"
        />
      </div>
    </div>
  );
};

export default PhoneInput;

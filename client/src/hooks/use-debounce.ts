import { useState, useEffect } from 'react';

/**
 * Hook za odlaganje promene vrednosti za određeni vremenski period
 * Korisno za smanjenje broja poziva prilikom korisničkog unosa
 * 
 * @param value Vrednost koja se menja
 * @param delay Vreme odlaganja u milisekundama
 * @returns Odložena vrednost
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Postavi tajmer da ažurira vrednost nakon delay ms
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Očisti tajmer ako se vrednost promeni pre isteka delay-a 
    // Ovo osigurava da se debouncedValue postavlja samo nakon delay-a od poslednje promene
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
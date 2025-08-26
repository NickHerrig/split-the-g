import { useState, useEffect, useRef } from "react";

export type PlacesAutocompleteProps = {
  onSelect: (data: { name: string; address: string }) => void;
  initialValue?: string;
  className?: string;
};

export function PlacesAutocomplete({
  onSelect,
  initialValue = "",
  className = "",
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<
    { name: string; address: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const currentInputRef = useRef<string>(initialValue);

  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current =
          new google.maps.places.AutocompleteService();
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };

    checkGoogleMapsLoaded();
  }, []);

  // Update inputValue when initialValue prop changes, but only if it's not empty and we don't have user input
  useEffect(() => {
    // Only update if initialValue is not empty and we don't have current user input
    if (initialValue && !currentInputRef.current) {
      setInputValue(initialValue);
      currentInputRef.current = initialValue;
    }
  }, [initialValue]);

  const fetchSuggestions = async (value: string) => {
    if (!value || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const predictions = await new Promise<
        google.maps.places.AutocompletePrediction[]
      >((resolve, reject) => {
        autocompleteService.current?.getPlacePredictions(
          {
            input: value,
            types: ["bar", "restaurant"],
          },
          (results, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              resolve(results);
            } else {
              reject(status);
            }
          }
        );
      });

      setSuggestions(
        predictions.map((prediction) => ({
          name: prediction.structured_formatting.main_text,
          address: prediction.structured_formatting.secondary_text,
        }))
      );
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching places:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (value: string) => {
    setInputValue(value);
    currentInputRef.current = value; // Store current value in ref

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Only fetch suggestions if there's at least 1 character
    if (value.length >= 1) {
      // Fetch suggestions immediately
      fetchSuggestions(value);
    } else {
      // Clear suggestions if input is empty
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        className={`w-full px-4 py-2 bg-guinness-black/50 border border-guinness-gold/20 rounded-lg text-guinness-tan focus:outline-none focus:border-guinness-gold ${className}`}
        placeholder="Search for a bar or enter manually"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-guinness-gold border-t-transparent rounded-full" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-guinness-black border border-guinness-gold/20 rounded-lg max-h-60 overflow-auto">
          {suggestions.map((place, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-guinness-gold/10 text-guinness-tan"
              onClick={() => {
                onSelect({ name: place.name, address: place.address });
                setInputValue(place.name);
                currentInputRef.current = place.name;
                setShowSuggestions(false);
              }}
            >
              <div className="font-medium">{place.name}</div>
              <div className="text-sm text-guinness-tan/60">
                {place.address}
              </div>
            </button>
          ))}
          <button
            className="w-full px-4 py-2 text-left hover:bg-guinness-gold/10 text-guinness-gold border-t border-guinness-gold/20"
            onClick={() => {
              onSelect({ name: inputValue, address: "" });
              currentInputRef.current = inputValue;
              setShowSuggestions(false);
            }}
          >
            Use custom name: "{inputValue}"
          </button>
        </div>
      )}
    </div>
  );
}

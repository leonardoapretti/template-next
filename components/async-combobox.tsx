// components/async-combobox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useDebounce } from "@/hooks/use-debounce";

const EMPTY_OPTIONS: never[] = [];

interface AsyncComboboxProps<T> {
  value?: T | null;
  onChange: (value: T | null) => void;
  onBlur?: () => void;
  fetchFn: (query: string) => Promise<T[]>;
  defaultOptions?: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  name?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

export function AsyncCombobox<T>({
  value,
  onChange,
  onBlur,
  fetchFn,
  defaultOptions = EMPTY_OPTIONS as T[],
  getOptionLabel,
  getOptionValue,
  placeholder,
  name,
  className,
  ...props
}: AsyncComboboxProps<T>) {
  const [inputValue, setInputValue] = useState(value ? getOptionLabel(value) : "");
  const [options, setOptions] = useState<T[]>(defaultOptions);
  const [isLoading, setIsLoading] = useState(false);
  const skipNextFetch = useRef(false);

  const debouncedQuery = useDebounce(inputValue, 400);

  // Sincroniza o input com o valor externo (ex: reset do form)
  useEffect(() => {
    setInputValue(value ? getOptionLabel(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, getOptionLabel]);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      setOptions([]);
      setIsLoading(false);
      return;
    }

    const selectedLabel = value ? getOptionLabel(value) : null;

    if (selectedLabel !== null && debouncedQuery === selectedLabel) {
      setOptions([]);
      return;
    }

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setOptions(defaultOptions);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    fetchFn(debouncedQuery)
      .then((results) => {
        if (active) setOptions(results);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, fetchFn, getOptionLabel, value, defaultOptions]);

  function handleInputValueChange(newValue: string) {
    setInputValue(newValue);

    if (value && newValue !== getOptionLabel(value)) {
      onChange(null);
    }

    if (newValue === "") {
      skipNextFetch.current = true;
      setOptions([]);
      setIsLoading(false);
    }
  }

  function handleValueChange(selected: T | null) {
    if (selected === null) {
      skipNextFetch.current = true;
      onChange(null);
      setInputValue("");
      setOptions([]);
      return;
    }

    onChange(selected);
    setInputValue(getOptionLabel(selected));
    setOptions([]);
  }

  return (
    <Combobox<T>
      items={options}
      value={value ?? null}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
      itemToStringLabel={(item) => (item ? getOptionLabel(item) : "")}
      isItemEqualToValue={(a, b) => getOptionValue(a) === getOptionValue(b)}
      filter={() => true}
    >
      <ComboboxInput
        name={name}
        placeholder={placeholder}
        onBlur={onBlur}
        className={className}
        showClear
        {...props}
      />
      <ComboboxContent>
        <ComboboxEmpty>{isLoading ? "Buscando..." : "Nenhum resultado encontrado."}</ComboboxEmpty>
        <ComboboxList>
          {(option: T) => (
            <ComboboxItem key={getOptionValue(option)} value={option}>
              {getOptionLabel(option)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

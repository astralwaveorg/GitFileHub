'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = '搜索...', className = '' }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevValueRef = useRef(value);

  // Sync local value from prop if it changes externally (not from our own updates)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  function handleChange(val: string) {
    prevValueRef.current = val;
    setLocalValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
    }, 200);
  }

  function handleClear() {
    const empty = '';
    prevValueRef.current = empty;
    setLocalValue(empty);
    onChange(empty);
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 pr-8 bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

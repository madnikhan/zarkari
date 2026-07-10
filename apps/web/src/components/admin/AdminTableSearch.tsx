"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  placeholder?: string;
  paramName?: string;
  defaultValue?: string;
  className?: string;
}

export function AdminTableSearch({
  placeholder = "Search…",
  paramName = "q",
  defaultValue = "",
  className = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramName) ?? defaultValue ?? "";
  const [value, setValue] = useState(urlValue);
  const lastPushed = useRef(urlValue);

  useEffect(() => {
    setValue(urlValue);
    lastPushed.current = urlValue;
  }, [urlValue]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastPushed.current) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set(paramName, trimmed);
      else params.delete(paramName);
      params.delete("page");
      lastPushed.current = trimmed;
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, paramName, router, searchParams]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={`w-full sm:w-72 px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]/30 ${className}`}
    />
  );
}

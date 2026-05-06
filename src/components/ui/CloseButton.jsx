import React from "react";
import { X } from "lucide-react";

export default function CloseButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Fechar"
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex-shrink-0 ${className}`}
    >
      <X className="w-4 h-4" />
    </button>
  );
}

import { useState } from "react";
import { ChevronUp, ChevronDown, Receipt, Sparkles } from "lucide-react";
import { calculateTotal, formatMoney, hasAnyPricing } from "../lib/pricing";

export default function PriceBadge({ form, pricing, sitterName }) {
  const [open, setOpen] = useState(false);

  if (!hasAnyPricing(pricing)) return null;

  const { total, lines, currency } = calculateTotal(form, pricing);
  const empty = lines.length === 0;

  return (
    <div className="no-print fixed bottom-24 right-4 md:right-6 z-50 pointer-events-auto" data-testid="price-badge">
      <div
        className={`bg-white border border-[#E8E4DF] shadow-[0_12px_40px_rgba(62,58,55,0.16)] transition-all duration-300 overflow-hidden ${
          open ? "rounded-3xl w-[320px]" : "rounded-full w-auto"
        }`}
      >
        {/* Collapsed header (always visible) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF9F6] transition-colors"
          data-testid="price-badge-toggle"
          aria-expanded={open}
        >
          <div className="w-9 h-9 rounded-full bg-[#8A9A7A] flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#A39E98] font-semibold">
              {empty ? "Estimate" : "Live estimate"}
            </div>
            <div className="font-heading text-lg font-extrabold text-[#3E3A37] leading-tight" data-testid="price-badge-total">
              {formatMoney(total, currency)}
            </div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-[#76706A]" /> : <ChevronUp className="w-4 h-4 text-[#76706A]" />}
        </button>

        {/* Expanded breakdown */}
        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-[#F4F3ED]">
            {empty ? (
              <p className="text-sm text-[#76706A] py-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#C58B71] mt-0.5 flex-shrink-0" />
                <span>Fill in dates and details to see the live estimate.</span>
              </p>
            ) : (
              <ul className="space-y-2 py-2" data-testid="price-breakdown">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#3E3A37] truncate">{l.label}</div>
                      {l.detail && <div className="text-xs text-[#76706A]">{l.detail}</div>}
                    </div>
                    <div className="text-sm font-heading font-bold text-[#3E3A37] whitespace-nowrap">
                      {formatMoney(l.amount, currency)}
                    </div>
                  </li>
                ))}
                <li className="pt-3 mt-2 border-t border-[#E8E4DF] flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#A39E98] font-semibold">Total</span>
                  <span className="font-heading text-xl font-extrabold text-[#3E3A37]">{formatMoney(total, currency)}</span>
                </li>
              </ul>
            )}
            <p className="text-[11px] text-[#A39E98] mt-3 leading-snug">
              Estimate by {sitterName || "your sitter"} — based on what you've filled in so far.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

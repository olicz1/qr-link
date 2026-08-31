"use client";

import Link from "next/link";
import { Clock3, Soup, Ticket } from "lucide-react";

export function PromoView() {
  return (
    <div className="px-3 pb-8">
      <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        <div className="bg-gradient-to-br from-[#07C160] to-[#06AD56] px-5 py-6 text-white">
          <p className="text-[12px] text-white/80">东风面馆 · Weekend only</p>
          <h1 className="mt-1 text-[22px] font-medium">周末套餐</h1>
          <p className="mt-1 text-[13px] text-white/90">
            Two bowls, one side, tea. Scan the gallery card to land here.
          </p>
        </div>
        <ul className="divide-y divide-black/5">
          <li className="flex items-start gap-3 px-4 py-3">
            <Soup className="mt-0.5 size-5 text-[#07C160]" />
            <div>
              <p className="text-[15px] font-medium">Beef + tomato noodles</p>
              <p className="text-[12px] text-[#888]">Large bowl · chili oil on the side</p>
            </div>
            <span className="ml-auto text-[15px]">¥18</span>
          </li>
          <li className="flex items-start gap-3 px-4 py-3">
            <Ticket className="mt-0.5 size-5 text-[#07C160]" />
            <div>
              <p className="text-[15px] font-medium">Add a second bowl</p>
              <p className="text-[12px] text-[#888]">Same price as the first</p>
            </div>
            <span className="ml-auto text-[15px]">¥18</span>
          </li>
          <li className="flex items-start gap-3 px-4 py-3">
            <Clock3 className="mt-0.5 size-5 text-[#07C160]" />
            <div>
              <p className="text-[15px] font-medium">Sat–Sun 11:00–15:00</p>
              <p className="text-[12px] text-[#888]">Show this page at the counter</p>
            </div>
          </li>
        </ul>
      </div>

      <p className="mt-3 rounded-xl bg-white px-4 py-3 text-[13px] leading-relaxed text-[#555] ring-1 ring-black/5">
        This is the “something else” path: a gallery card can open a payment
        sheet, a promo page, or decoded text. In production this would be a
        mini program route or an H5 page behind the QR payload.
      </p>

      <Link
        href="/"
        className="mt-4 flex h-12 items-center justify-center rounded-[8px] bg-[#07C160] text-[17px] font-medium text-white"
      >
        Back to 码柜
      </Link>
    </div>
  );
}

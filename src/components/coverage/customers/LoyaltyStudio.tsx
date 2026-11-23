"use client";

import { useState } from "react";
import { LoyaltyCalculator } from "../LoyaltyCalculator";
import { MemberCard } from "./MemberCard";

/** The membership card and the benefit calculator, sharing the member's name. */
export function LoyaltyStudio() {
  const [name, setName] = useState("");
  return (
    <div className="grid items-center gap-12 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-6">
        <MemberCard name={name} />
        <p className="kicker mt-6 text-center text-mute">Move over the card &middot; tap to see the programme</p>
      </div>
      <div className="md:col-span-6">
        <LoyaltyCalculator name={name} onName={setName} />
      </div>
    </div>
  );
}

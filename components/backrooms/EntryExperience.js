"use client";

import { useState } from "react";
import ComputerRoom from "./ComputerRoom";
import BackroomsExplorer from "./BackroomsExplorer";
import "./entry.css";

export default function EntryExperience() {
  const [usingComputer, setUsingComputer] = useState(false);
  if (!usingComputer) return <ComputerRoom onEnter={() => setUsingComputer(true)} />;
  return <BackroomsExplorer onLeave={() => setUsingComputer(false)} />;
}

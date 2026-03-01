"use client";

import { useEffect } from "react";

export function DisableDevTools() {
  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
      }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
      }
      // Ctrl+Shift+C / Cmd+Option+C (Element Picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
      }
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
      }
    };

    // Add listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}

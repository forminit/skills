"use client";

import { useState } from "react";

const ROLES = ["Frontend Engineer", "Product Designer", "Customer Success"];

export function ApplyForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("https://formspree.io/f/xxxxxxxx", {
      method: "POST",
      body: new FormData(e.currentTarget),
      headers: { Accept: "application/json" },
    });
    setState(res.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return <p className="mt-10 rounded-lg bg-emerald-50 p-6 text-emerald-800">Thanks for applying! We will be in touch.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <input type="hidden" name="_subject" value="New job application" />
      <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Full name</label>
        <input id="name" name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium">LinkedIn profile</label>
        <input id="linkedin" name="linkedin" type="url" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium">Role</label>
        <select id="role" name="role" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="years" className="block text-sm font-medium">Years of experience</label>
        <input id="years" name="years" type="number" min={0} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="cover" className="block text-sm font-medium">Why Acme?</label>
        <textarea id="cover" name="message" rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="resume" className="block text-sm font-medium">Resume (PDF)</label>
        <input id="resume" name="resume" type="file" accept="application/pdf" required className="mt-1 block w-full text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="consent" required /> I agree that Acme may store my application for 12 months.
      </label>
      {state === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
      <button type="submit" disabled={state === "sending"} className="rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white">
        {state === "sending" ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}

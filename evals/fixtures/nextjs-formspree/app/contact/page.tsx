import { ApplyForm } from "@/components/ApplyForm";

export const metadata = { title: "Apply | Acme Careers" };

export default function ApplyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Apply to Acme</h1>
      <p className="mt-3 text-slate-600">We read every application. Expect a reply within a week.</p>
      <ApplyForm />
    </main>
  );
}

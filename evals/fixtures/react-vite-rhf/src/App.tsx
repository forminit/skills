import { DemoRequestForm } from "./components/DemoRequestForm";

export default function App() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Book a BrightDesk demo</h1>
        <p>See how teams answer customers twice as fast.</p>
      </section>
      <DemoRequestForm />
    </main>
  );
}

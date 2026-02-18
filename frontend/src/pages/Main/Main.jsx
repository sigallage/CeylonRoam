//(Tash) Important: The component in Main.jsx renders the “results” view after the itinerary generator submits to the backend. (Tash)

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const formatList = (items) => {
  if (!items || items.length === 0) {
    return "None";
  }
  if (items.length === 1) {
    return items[0];
  }
  return items.join(", ");
};

const formatTravelDescriptor = (value) => {
  if (!value) {
    return "Solo";
  }
  return value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const Main = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const aiResponse = location.state?.aiResponse ?? null;

  useEffect(() => {
    if (!aiResponse) {
      const timeoutId = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [aiResponse, navigate]);

  if (!aiResponse) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 text-center text-black">
        <p className="text-lg font-medium">No travel prompt generated. Redirecting to the planner…</p>
      </div>
    );
  }

  const { summary, itinerary, generated_at, metadata } = aiResponse;
  const dateLabel = metadata?.date_range?.label ?? "Dates not specified";

  return (
    <div className="min-h-screen w-full bg-white px-4 py-10 text-black sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-wide text-black">
            Generated Travel Plan
          </h1>
          <p className="text-base italic text-black/80">Here is your tailored travel itinerary.</p>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-black/85">{summary}</p>
        </section>

        <section className="rounded-3xl border border-[#FFD700]/40 bg-[#FFF9DB] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Travel Itinerary</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black">
            {itinerary}
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-black/80 shadow-sm">
          <h3 className="text-base font-semibold text-black">Details</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li><span className="font-medium text-black">Dates:</span> {dateLabel}</li>
            <li><span className="font-medium text-black">Budget:</span> {metadata?.budget_label ? `${metadata.budget_label} LKR` : "Not specified"}</li>
            <li><span className="font-medium text-black">Traveling with:</span> {formatTravelDescriptor(metadata?.traveling_with)}</li>
            <li><span className="font-medium text-black">Purposes:</span> {formatList(metadata?.purposes)}</li>
            <li className="sm:col-span-2"><span className="font-medium text-black">Provinces:</span> {formatList(metadata?.provinces)}</li>
            <li className="sm:col-span-2"><span className="font-medium text-black">Preferences:</span> {formatList(metadata?.preferences)}</li>
          </ul>
        </section>

        <div className="rounded-2xl border border-black/10 bg-white p-4 text-xs uppercase tracking-wide text-black/60 shadow-sm">
          <span className="font-semibold text-black">Generated:</span>{" "}
          {new Date(generated_at).toLocaleString()}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="rounded-2xl border border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:border-yellow-400 hover:text-yellow-500"
          >
            Plan Another Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main;
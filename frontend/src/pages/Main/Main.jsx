//(Tash) Important: The component in Main.jsx renders the “results” view after the itinerary generator submits to the backend. (Tash)

import { useEffect, useMemo, useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const authBaseUrl = useMemo(
    () => import.meta.env.VITE_AUTH_URL?.replace(/\/$/, '') || 'http://localhost:5001',
    [],
  );

  const handleSaveItinerary = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      // Get user data and token from localStorage
      const storedData = localStorage.getItem('ceylonroam_user');
      if (!storedData) {
        setSaveError('Please log in to save itineraries');
        setIsSaving(false);
        return;
      }

      const parsed = JSON.parse(storedData);
      const token = parsed.token;

      // Calculate number of days
      const startDate = new Date(metadata?.date_range?.start);
      const endDate = new Date(metadata?.date_range?.end);
      const numberOfDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Prepare itinerary data to save
      const itineraryPayload = {
        title: `${formatList(metadata?.provinces)} Trip - ${dateLabel}`,
        destination: formatList(metadata?.provinces),
        startDate: metadata?.date_range?.start || new Date().toISOString(),
        endDate: metadata?.date_range?.end || new Date().toISOString(),
        numberOfDays: numberOfDays || 1,
        budget: metadata?.budget_label || '',
        interests: metadata?.preferences || [],
        itineraryData: {
          summary,
          itinerary,
          generated_at,
          metadata
        }
      };

      // Call API to save itinerary
      const response = await fetch(`${authBaseUrl}/api/itineraries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itineraryPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save itinerary');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setSaveError(error.message || 'Failed to save itinerary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

        {/* Save/Error Messages */}
        {saveSuccess && (
          <div className="rounded-2xl border border-green-500 bg-green-50 px-6 py-3 text-center text-sm font-medium text-green-700">
            ✓ Itinerary saved successfully!
          </div>
        )}
        {saveError && (
          <div className="rounded-2xl border border-red-500 bg-red-50 px-6 py-3 text-center text-sm font-medium text-red-700">
            {saveError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            onClick={handleSaveItinerary}
            disabled={isSaving || saveSuccess}
            className="rounded-2xl border border-green-600 bg-green-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Itinerary'}
          </button>
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
import axios from "axios"; //used to make HTTP requests
import { AnimatePresence, motion } from "framer-motion";  // used for animations
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; //used to navigate between pages
import destinationsRaw from "../../dataset/destinations.json";

import { getItineraryApiBaseUrl } from '../../config/backendUrls';

const API_BASE_URL = getItineraryApiBaseUrl(); //ensures axios hits the correct backend in dev/prod

const ROUTE_OPTIMIZER_GENERATED_ITIN_KEY = "ceylonroam:itineraryGenerator:itinerary:v1";

const DESTINATION_CATALOG_STOPS = destinationsRaw.map((dest) => ({
  id: dest.id || dest.name,
  name: dest.name,
  location: { lat: dest.latitude, lng: dest.longitude },
  description: dest.description
}));

const buildRouteOptimizerStopsFromAiResponse = (aiResponse) => {
  const summary = typeof aiResponse?.summary === "string" ? aiResponse.summary : "";
  const itinerary = typeof aiResponse?.itinerary === "string" ? aiResponse.itinerary : "";
  const haystack = `${summary}\n${itinerary}`.toLowerCase();

  const matches = DESTINATION_CATALOG_STOPS.map((stop) => ({
    idx: haystack.indexOf(String(stop.name || "").toLowerCase()),
    stop
  }))
    .filter((m) => m.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  const uniqueIds = new Set();
  const stops = [];
  for (const { stop } of matches) {
    if (!stop?.id || uniqueIds.has(stop.id)) continue;
    uniqueIds.add(stop.id);
    stops.push({
      id: stop.id,
      name: stop.name,
      location: stop.location,
      description: stop.description || ""
    });
    if (stops.length >= 30) break;
  }

  return stops;
};

const toLocalISODate = (date) => { //converts a date to ISO format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { //formatter for month and year
  month: "long",
  year: "numeric"
});

const dayFormatter = new Intl.DateTimeFormat("en-US", { //formatter for day and month
  month: "short",
  day: "numeric"
});

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; //labels for the days of the week

const SRI_LANKA_PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa"
];

const ItineraryGenerator = () => { //main component for the itinerary generator
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    purposeInput: "",
    budget: "",
    tripType: "solo",
    preferencesInput: "",
    gender: "male",
    selectedProvinces: []
  });
  const [startDate, setStartDate] = useState(null); //start date in ISO format
  const [endDate, setEndDate] = useState(null); //end date in ISO format
  const [showCalendarOnly, setShowCalendarOnly] = useState(false); // controls calendar-only view
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false); //toggle province dropdown
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() }; //current year and month
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => { //cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current); //clears the timeout if it exists
      }
    };
  }, []);

  const calendarDays = useMemo(() => { //generates the days to display in the calendar
    const { year, month } = calendarCursor;
    const firstOfMonth = new Date(year, month, 1);
    const startDayOffset = firstOfMonth.getDay();
    const calendarStart = new Date(year, month, 1 - startDayOffset);

    return Array.from({ length: 42 }, (_, index) => { //42 days to cover 6 weeks
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);
      return {
        isoValue: toLocalISODate(date),
        label: String(date.getDate()),
        isCurrentMonth:
          date.getMonth() === month && date.getFullYear() === year
      };
    });
  }, [calendarCursor]);

  const formattedSelectedDates = useMemo(() => { //formats the date range for display
    if (!startDate && !endDate) {
      return "";
    }

    if (startDate && !endDate) {
      return dayFormatter.format(new Date(startDate));
    }

    if (startDate && endDate) {
      return `${dayFormatter.format(new Date(startDate))} - ${dayFormatter.format(new Date(endDate))}`;
    }

    return "";
  }, [startDate, endDate]);

  const isPastDate = (isoValue) => { //checks if a date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const dateToCheck = new Date(isoValue);
    return dateToCheck < today;
  };

  const handleFieldChange = ( //handles changes to form fields
    field,
    value
  ) => {
    setFormState((prev) => ({ //updates the form state
      ...prev,
      [field]: value
    }));
  };

  const handleDateClick = (isoValue) => { //handles date selection for range
    if (isSubmitting || isPastDate(isoValue)) {
      return;
    }

    if (!startDate) {
      setStartDate(isoValue);
      setEndDate(null);
      return;
    }

    if (startDate && !endDate) {
      const clickedTime = new Date(isoValue).getTime();
      const startTime = new Date(startDate).getTime();

      if (clickedTime < startTime) {
        setStartDate(isoValue);
        setEndDate(null);
      } else if (clickedTime === startTime) {
        setStartDate(null);
        setEndDate(null);
      } else {
        setEndDate(isoValue);
      }
      return;
    }

    if (startDate && endDate) {
      setStartDate(isoValue);
      setEndDate(null);
    }
  };

  const isDateInRange = (isoValue) => { //checks if a date is in the selected range
    if (!startDate) return false;

    const dateTime = new Date(isoValue).getTime();
    const startTime = new Date(startDate).getTime();

    if (!endDate) {
      return dateTime === startTime;
    }

    const endTime = new Date(endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const isStartOrEndDate = (isoValue) => { //checks if date is start or end
    return isoValue === startDate || isoValue === endDate;
  };

  const toggleProvinceSelection = (province) => { //toggles the selection of a province
    if (isSubmitting) {
      return;
    }

    setFormState((prev) => {
      const currentProvinces = prev.selectedProvinces;
      if (currentProvinces.includes(province)) {
        return {
          ...prev,
          selectedProvinces: currentProvinces.filter((p) => p !== province)
        };
      }
      return {
        ...prev,
        selectedProvinces: [...currentProvinces, province]
      };
    });
  };

  const handleSubmit = (event) => { //handles form submission
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const submissionStartedAt = Date.now(); //timestamp for submission start
    setError(null);
    setIsSubmitting(true);
    setShowMessage(true);

    const parseList = (value) =>
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);

    const numericBudget = Number.parseInt(formState.budget.replace(/[^0-9]/g, ""), 10); //parses budget input
    const budgetValue = Number.isNaN(numericBudget) //checks if budget is a valid number
      ? formState.budget.trim() //if not, use the raw input
      : numericBudget;

    const preparedPayload = { //prepares the payload for submission
      gender: formState.gender,
      purpose: parseList(formState.purposeInput), //parses purpose input
      traveling_with: formState.tripType,
      budget_lkr: budgetValue,
      preferences: parseList(formState.preferencesInput), //parses preferences input
      start_date: startDate,
      end_date: endDate,
      provinces: formState.selectedProvinces
    };

    axios //makes a POST request to the backend API
      .post(`${API_BASE_URL}/generate`, preparedPayload)
      .then((response) => {
        const elapsed = Date.now() - submissionStartedAt; //calculates elapsed time
        const remaining = Math.max(0, 5000 - elapsed);

        try {
          const derivedStops = buildRouteOptimizerStopsFromAiResponse(response.data);
          window.localStorage.setItem(
            ROUTE_OPTIMIZER_GENERATED_ITIN_KEY,
            JSON.stringify(derivedStops)
          );
        } catch {
          // ignore storage failures (private mode / quota / etc.)
        }

        if (timeoutRef.current) { //clears existing timeout if any
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => { //sets a timeout to ensure minimum display time
          setShowMessage(false);
          setIsSubmitting(false);
          navigate("/main", { state: { aiResponse: response.data } });
          timeoutRef.current = null;
        }, remaining);
      })
      .catch((requestError) => { //handles errors during submission
        console.error("Trip plan submission failed", requestError);
        setShowMessage(false);
        setIsSubmitting(false);
        setError("We couldn't reach the travel planner. Please verify the backend server is running and try again.");
      });
  };

  const goToAdjacentMonth = (offset) => { //navigates to the previous or next month
    setCalendarCursor((prev) => {
      const nextMonth = new Date(prev.year, prev.month + offset, 1);
      return {
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth()
      };
    });
  };

  const currentMonthLabel = monthFormatter.format( //formats the current month label
    new Date(calendarCursor.year, calendarCursor.month, 1)
  );

  return (
    <div
      className="min-h-screen w-full px-3 py-6 sm:px-6 sm:py-10 lg:px-12"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-10">
        <div className="space-y-2 text-center text-white">
          <h1 className="text-2xl font-semibold uppercase tracking-wide sm:text-3xl bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,193,7,0.25)]">
            Plan your trip
          </h1>
          <p className="text-sm italic text-white/80 sm:text-base">Enter your trip details.</p>
        </div>

        <form className="flex flex-col gap-4 sm:gap-6" onSubmit={handleSubmit}>
          {/* Gradient border wrapper */}
          <div
            className="rounded-[3.5rem] p-1 p-[2px] sm:rounded-[5rem]"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'linear-gradient(to right, #facc15, #f97316)',
            }}
          >
            <div
              className="flex flex-col gap-4 rounded-[3.5rem] bg-black p-8 transition-all duration-300 sm:gap-5 sm:rounded-[5rem] sm:p-12 lg:p-16"
              style={{
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div className="flex flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4">
                <span className="text-lg font-bold text-white mb-1">Purpose of trip</span>
                <input
                  aria-label="Purpose of trip"
                  className="w-full flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white placeholder:text-gray-400 shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
                  placeholder="e.g., surfing, cultural, wellness"
                  value={formState.purposeInput}
                  onChange={(event) => handleFieldChange("purposeInput", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4">
                <span className="text-base font-bold text-white mb-1">Budget (LKR)</span>
                <input
                  aria-label="Budget in LKR"
                  className="w-full flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white placeholder:text-gray-400 shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
                  placeholder="Budget (LKR)"
                  value={formState.budget}
                  inputMode="numeric"
                  onChange={(event) => handleFieldChange("budget", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <div
                  className="flex cursor-pointer flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4"
                  onClick={() => !isSubmitting && setShowProvinceDropdown(!showProvinceDropdown)}
                >
                  <span className="text-base font-bold text-white mb-1">Provinces to visit</span>
                  <div className="w-full flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white shadow-inner sm:rounded-xl sm:px-4 sm:py-3 sm:text-base">
                    {formState.selectedProvinces.length > 0
                      ? formState.selectedProvinces.join(", ")
                      : "Select provinces"}
                  </div>
                </div>
                {showProvinceDropdown && (
                  <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-700 bg-black p-3 shadow-lg sm:rounded-xl sm:p-4">
                    <div className="space-y-2">
                      {SRI_LANKA_PROVINCES.map((province) => (
                        <label
                          key={province}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition hover:bg-gray-800 active:bg-gray-900 sm:p-2"
                        >
                          <input
                            type="checkbox"
                            checked={formState.selectedProvinces.includes(province)}
                            onChange={() => toggleProvinceSelection(province)}
                            disabled={isSubmitting}
                            className="h-5 w-5 rounded border-white/30 text-yellow-300 focus:ring-white sm:h-4 sm:w-4 bg-black"
                          />
                          <span className="text-sm text-white">{province}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4">
                <span className="text-base font-bold text-white mb-1">Solo or family</span>
                <select
                  aria-label="Solo or family"
                  className="w-full flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
                  value={formState.tripType}
                  onChange={(event) => handleFieldChange("tripType", event.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="solo">Solo</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4">
                <span className="text-base font-bold text-white mb-1">Additional preferences</span>
                <textarea
                  aria-label="Additional preferences"
                  className="h-24 w-full flex-1 resize-none rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
                  placeholder="Any additional preferences (e.g., vegetarian meals, wheelchair access)"
                  value={formState.preferencesInput}
                  onChange={(event) => handleFieldChange("preferencesInput", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-[#444] bg-black p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-4">
                <span className="text-base font-bold text-white mb-1">Dates spending</span>
                <input
                  aria-label="Selected travel dates"
                  className="w-full flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
                  placeholder="Select dates from the calendar"
                  value={formattedSelectedDates}
                  readOnly
                  disabled={isSubmitting}
                  onClick={() => setShowCalendarOnly(true)}
                  style={{ cursor: 'pointer', background: isSubmitting ? undefined : '#18181b' }}
                />
              </div>

              <div className="rounded-xl border border-white/15 bg-black/40 p-4 sm:rounded-2xl sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-base font-bold text-white mb-1">Gender</span>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white sm:gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formState.gender === "male"}
                        onChange={(event) => handleFieldChange("gender", event.target.value)}
                        disabled={isSubmitting}
                        className="h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4"
                        style={{ accentColor: '#fbbf24' }}
                      />
                      <span className="text-yellow-300">Male</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formState.gender === "female"}
                        onChange={(event) => handleFieldChange("gender", event.target.value)}
                        disabled={isSubmitting}
                        className="h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4"
                        style={{ accentColor: '#fbbf24' }}
                      />
                      <span className="text-yellow-300">Female</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={formState.gender === "other"}
                        onChange={(event) => handleFieldChange("gender", event.target.value)}
                        disabled={isSubmitting}
                        className="h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4"
                        style={{ accentColor: '#fbbf24' }}
                      />
                      <span className="text-yellow-300">Other</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End gradient border wrapper */}

          {showCalendarOnly && (
            <section className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-black">Select Dates</h2>
                  <button
                    type="button"
                    className="text-black text-xl font-bold px-2 py-1 rounded hover:bg-gray-200"
                    onClick={() => setShowCalendarOnly(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => goToAdjacentMonth(-1)}
                    className="min-w-[44px] h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-black/10 active:bg-black/20 transition text-black disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    aria-label="Previous Month"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5 19L9.5 12L15.5 5" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <p className="min-w-[120px] text-center text-base font-medium text-black">
                    {currentMonthLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToAdjacentMonth(1)}
                    className="min-w-[44px] h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-black/10 active:bg-black/20 transition text-black disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    aria-label="Next Month"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 5L14.5 12L8.5 19" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-black/60 sm:gap-2 sm:text-xs mb-2">
                  {WEEKDAY_LABELS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {calendarDays.map(({ isoValue, label, isCurrentMonth }) => {
                    const inRange = isDateInRange(isoValue);
                    const isStartEnd = isStartOrEndDate(isoValue);
                    const isPast = isPastDate(isoValue);

                    // Determine if this is the start or end date
                    const isStart = startDate && isoValue === startDate;
                    const isEnd = endDate && isoValue === endDate;

                    let buttonStyle = undefined;
                    if (isStart || isEnd) {
                      buttonStyle = {
                        background: 'linear-gradient(to right, #facc15, #f97316)',
                        fontWeight: 700,
                        color: '#222',
                        border: 0
                      };
                    } else if (inRange) {
                      buttonStyle = {
                        background: 'linear-gradient(to right, #facc1599, #f9731699)', // lighter gradient (60% opacity)
                        fontWeight: 600,
                        color: '#222',
                        border: 0
                      };
                    } else if (isStartEnd) {
                      buttonStyle = { background: '#fff' };
                    }

                    return (
                      <button
                        type="button"
                        key={isoValue}
                        onClick={() => {
                          const prevStart = startDate;
                          const prevEnd = endDate;
                          handleDateClick(isoValue);
                          // After clicking, if both start and end are set (and changed), close calendar
                          setTimeout(() => {
                            if (
                              (!prevStart || !prevEnd) &&
                              startDate && endDate &&
                              (startDate !== prevStart || endDate !== prevEnd)
                            ) {
                              setShowCalendarOnly(false);
                            }
                          }, 0);
                        }}
                        disabled={!isCurrentMonth || isSubmitting || isPast}
                        className={`flex h-10 w-full items-center justify-center rounded-lg border text-xs transition touch-manipulation sm:h-12 sm:rounded-xl sm:text-sm ${
                          !isCurrentMonth || isPast
                            ? "cursor-not-allowed border-transparent bg-black/5 text-black/30"
                            : (inRange || isStart || isEnd)
                              ? "border-0 font-semibold text-black shadow-[0_0_12px_rgba(255,193,7,0.25)]"
                              : "border-black/10 bg-white text-black hover:border-gray-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] active:bg-gray-50"
                        }`}
                        style={buttonStyle}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="min-h-[44px] w-full rounded-full bg-white px-4 py-3 text-lg font-bold text-black shadow-md transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(0,0,0,0.2)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none touch-manipulation sm:px-6 sm:py-3"
              onClick={() => {
                setFormState({
                  purposeInput: "",
                  budget: "",
                  tripType: "solo",
                  preferencesInput: "",
                  gender: "male",
                  selectedProvinces: []
                });
                setStartDate(null);
                setEndDate(null);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,255,255,0.6)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none touch-manipulation sm:px-6 sm:py-3"
              disabled={isSubmitting}
            >
              Enter
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-center text-xs font-medium text-black sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
              {error}
            </p>
          )}
        </form>

        <AnimatePresence>
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto w-full max-w-md rounded-xl border border-black/10 bg-white px-4 py-3 text-center shadow-lg sm:rounded-2xl sm:px-6 sm:py-4"
            >
              <p className="text-sm font-medium text-black sm:text-base">Message: Generating...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ItineraryGenerator; //exports the component
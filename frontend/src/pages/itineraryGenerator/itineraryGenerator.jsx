import axios from "axios"; //used to make HTTP requests
import { AnimatePresence, motion } from "framer-motion";  // used for animations
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; //used to navigate between pages
import destinationsRaw from "../../dataset/destinations.json";
import { useTheme } from '../../context/ThemeContext';

import { getItineraryApiBaseUrl } from '../../config/backendUrls';

const API_BASE_URL = getItineraryApiBaseUrl(); //ensures axios hits the correct backend in dev/prod

const ROUTE_OPTIMIZER_GENERATED_ITIN_KEY = "ceylonroam:itineraryGenerator:itinerary:v1";
const ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY = "ceylonroam:itineraryGenerator:itineraryHistory:v1";
const ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_MAX = 25;

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
	const { isDarkMode } = useTheme();
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

        // Append to history (most-recent-first)
        const historyEntry = {
        id: `gen-${Date.now()}`,
        createdAt: new Date().toISOString(),
        startDate: startDate,
        endDate: endDate,
        stops: derivedStops,
        };
        try {
        const raw = window.localStorage.getItem(ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const nextHistory = Array.isArray(parsed) ? [historyEntry, ...parsed] : [historyEntry];
        window.localStorage.setItem(
          ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY,
          JSON.stringify(nextHistory.slice(0, ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_MAX))
        );
        } catch {
        // ignore history storage failures
        }
        } catch {
          // ignore storage failures (private mode / quota / etc.)
        }

        if (timeoutRef.current) { //clears existing timeout if any
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => { //sets a timeout to ensure minimum display time
          setShowMessage(false);
          setIsSubmitting(false);
          navigate("/main", { state: { aiResponse: response.data, derivedStops } });
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

  const panelClass = isDarkMode
    ? 'space-y-3 rounded-2xl border border-[#444] bg-black p-4'
    : 'space-y-3 rounded-2xl border border-gray-300 bg-white p-4';

  const fieldClass = isDarkMode
    ? 'w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-base text-white placeholder:text-gray-400 shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30'
    : 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:bg-gray-100';

  const textAreaClass = isDarkMode
    ? 'h-24 w-full resize-none rounded-xl border border-gray-700 bg-black px-4 py-3 text-base text-white placeholder:text-gray-400 shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-black/30'
    : 'h-24 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:bg-gray-100';

  const labelClass = isDarkMode
    ? 'block text-sm font-bold italic text-white/80'
    : 'block text-sm font-bold italic text-gray-700';

  return (
    <div className="min-h-screen w-full px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className={`space-y-2 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <h1 className="text-3xl font-semibold uppercase tracking-wide">Plan your trip</h1>
          <p className={isDarkMode ? 'text-sm italic text-white/80 sm:text-base' : 'text-sm italic text-gray-700 sm:text-base'}>
            Enter your trip details.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div
            className={`space-y-6 rounded-3xl p-5 shadow-xl sm:p-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
            style={{
              border: '1px solid transparent',
              backgroundImage: isDarkMode
                ? 'linear-gradient(#000, #000), linear-gradient(to right, #facc15, #f97316)'
                : 'linear-gradient(#fff, #fff), linear-gradient(to right, #facc15, #f97316)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            <section className={panelClass}>
              <label className={labelClass}>Purpose of trip</label>
              <input
                aria-label="Purpose of trip"
                className={fieldClass}
                placeholder="e.g., surfing, cultural, wellness"
                value={formState.purposeInput}
                onChange={(event) => handleFieldChange('purposeInput', event.target.value)}
                disabled={isSubmitting}
              />
            </section>

            <section className={panelClass}>
              <label className={labelClass}>Budget (LKR)</label>
              <input
                aria-label="Budget in LKR"
                className={fieldClass}
                placeholder="Budget (LKR)"
                value={formState.budget}
                inputMode="numeric"
                onChange={(event) => handleFieldChange('budget', event.target.value)}
                disabled={isSubmitting}
              />
            </section>

            <section className={`${panelClass} relative`}>
              <label className={labelClass}>Provinces to visit</label>
              <button
                type="button"
                className={`${fieldClass} text-left`}
                onClick={() => !isSubmitting && setShowProvinceDropdown(!showProvinceDropdown)}
                disabled={isSubmitting}
              >
                {formState.selectedProvinces.length > 0
                  ? formState.selectedProvinces.join(', ')
                  : 'Select provinces'}
              </button>

              {showProvinceDropdown && (
                <div
                  className={isDarkMode
                    ? 'absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-700 bg-black p-4 shadow-lg'
                    : 'absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white p-4 shadow-lg'}
                >
                  <div className="space-y-2">
                    {SRI_LANKA_PROVINCES.map((province) => (
                      <label
                        key={province}
                        className={isDarkMode
                          ? 'flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition hover:bg-gray-800 active:bg-gray-900'
                          : 'flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition hover:bg-gray-100 active:bg-gray-200'}
                      >
                        <input
                          type="checkbox"
                          checked={formState.selectedProvinces.includes(province)}
                          onChange={() => toggleProvinceSelection(province)}
                          disabled={isSubmitting}
                          className={isDarkMode
                            ? 'h-5 w-5 rounded border-white/30 bg-black text-yellow-300 focus:ring-white sm:h-4 sm:w-4'
                            : 'h-5 w-5 rounded border-gray-400 bg-white text-amber-500 focus:ring-amber-300 sm:h-4 sm:w-4'}
                        />
                        <span className={isDarkMode ? 'text-sm text-white' : 'text-sm text-gray-900'}>{province}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className={panelClass}>
              <label className={labelClass}>Solo or family</label>
              <select
                aria-label="Solo or family"
                className={fieldClass}
                value={formState.tripType}
                onChange={(event) => handleFieldChange('tripType', event.target.value)}
                disabled={isSubmitting}
              >
                <option value="solo">Solo</option>
                <option value="family">Family</option>
              </select>
            </section>

            <section className={panelClass}>
              <label className={labelClass}>Additional preferences</label>
              <textarea
                aria-label="Additional preferences"
                className={textAreaClass}
                placeholder="Any additional preferences (e.g., vegetarian meals, wheelchair access)"
                value={formState.preferencesInput}
                onChange={(event) => handleFieldChange('preferencesInput', event.target.value)}
                disabled={isSubmitting}
              />
            </section>

            <section className={panelClass}>
              <label className={labelClass}>Dates spending</label>
              <input
                aria-label="Selected travel dates"
                className={fieldClass}
                placeholder="Select dates from the calendar"
                value={formattedSelectedDates}
                readOnly
                disabled={isSubmitting}
                onClick={() => setShowCalendarOnly(true)}
                style={{ cursor: 'pointer' }}
              />
            </section>

            <section className={panelClass}>
              <label className={labelClass}>Gender</label>
              <div className={isDarkMode ? 'flex flex-wrap items-center gap-4 text-sm text-white' : 'flex flex-wrap items-center gap-4 text-sm text-gray-900'}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formState.gender === 'male'}
                    onChange={(event) => handleFieldChange('gender', event.target.value)}
                    disabled={isSubmitting}
                    className={isDarkMode
                      ? 'h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4'
                      : 'h-5 w-5 border-gray-400 text-amber-500 focus:ring-amber-300 sm:h-4 sm:w-4'}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  <span className={isDarkMode ? 'text-yellow-300' : 'text-amber-600'}>Male</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formState.gender === 'female'}
                    onChange={(event) => handleFieldChange('gender', event.target.value)}
                    disabled={isSubmitting}
                    className={isDarkMode
                      ? 'h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4'
                      : 'h-5 w-5 border-gray-400 text-amber-500 focus:ring-amber-300 sm:h-4 sm:w-4'}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  <span className={isDarkMode ? 'text-yellow-300' : 'text-amber-600'}>Female</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formState.gender === 'other'}
                    onChange={(event) => handleFieldChange('gender', event.target.value)}
                    disabled={isSubmitting}
                    className={isDarkMode
                      ? 'h-5 w-5 border-white/60 text-white focus:ring-white sm:h-4 sm:w-4'
                      : 'h-5 w-5 border-gray-400 text-amber-500 focus:ring-amber-300 sm:h-4 sm:w-4'}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  <span className={isDarkMode ? 'text-yellow-300' : 'text-amber-600'}>Other</span>
                </label>
              </div>
            </section>
          

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
              className={isDarkMode
                ? 'min-h-[44px] w-full rounded-xl border border-gray-600 bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1c1c1c] disabled:cursor-not-allowed disabled:bg-black/30'
                : 'min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100'}
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
              className="min-h-[44px] w-full rounded-xl border border-yellow-400/60 bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-3 text-base font-semibold text-white shadow transition-all duration-200 hover:shadow-yellow-500/40 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-700 disabled:text-white/50 disabled:shadow-none"
              disabled={isSubmitting}
            >
              Enter
            </button>
          </div>

          {error && (
            <p className={isDarkMode
              ? 'rounded-xl border border-gray-700 bg-black px-4 py-3 text-center text-sm font-medium text-white'
              : 'rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-900'}>
              {error}
            </p>
          )}

          </div>
        </form>

        <AnimatePresence>
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={isDarkMode
                ? 'mx-auto w-full max-w-md rounded-2xl border border-gray-700 bg-black px-6 py-4 text-center shadow-lg'
                : 'mx-auto w-full max-w-md rounded-2xl border border-black/10 bg-white px-6 py-4 text-center shadow-lg'}
            >
              <p className={isDarkMode ? 'text-sm font-medium text-white sm:text-base' : 'text-sm font-medium text-black sm:text-base'}>
                Message: Generating...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ItineraryGenerator; //exports the component
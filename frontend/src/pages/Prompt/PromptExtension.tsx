import axios from "axios"; //used to make HTTP requests
import { AnimatePresence, motion } from "framer-motion";  // used for animations
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; //used to navigate between pages

type TripFormState = { //state of the trip form
  purposeInput: string;
  budget: string;
  tripType: "solo" | "family";
  preferencesInput: string;
  gender: "male" | "female" | "other";
  selectedProvinces: string[];
};

type CalendarDay = { //type for each day in the calendar
  isoValue: string;
  label: string;
  isCurrentMonth: boolean;
};

const toLocalISODate = (date: Date) => { //converts a date to ISO format
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

const PromptExtension = () => { //main component for the prompt extension
  const navigate = useNavigate();
  const [formState, setFormState] = useState<TripFormState>({
    purposeInput: "",
    budget: "",
    tripType: "solo",
    preferencesInput: "",
    gender: "male",
    selectedProvinces: []
  });
  const [startDate, setStartDate] = useState<string | null>(null); //start date in ISO format
  const [endDate, setEndDate] = useState<string | null>(null); //end date in ISO format
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false); //toggle province dropdown
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() }; //current year and month
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => { //cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current); //clears the timeout if it exists
      }
    };
  }, []);

  const calendarDays = useMemo<CalendarDay[]>(() => { //generates the days to display in the calendar
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

  const handleFieldChange = ( //handles changes to form fields
    field: keyof TripFormState,
    value: string
  ) => {
    setFormState((prev) => ({ //updates the form state
      ...prev,
      [field]: value
    }));
  };

  const handleDateClick = (isoValue: string) => { //handles date selection for range
    if (isSubmitting) {
      return;
    }

    // If no start date, set it
    if (!startDate) {
      setStartDate(isoValue);
      setEndDate(null);
      return;
    }

    // If start date exists but no end date
    if (startDate && !endDate) {
      const clickedTime = new Date(isoValue).getTime();
      const startTime = new Date(startDate).getTime();

      // If clicked date is before start date, reset start date
      if (clickedTime < startTime) {
        setStartDate(isoValue);
        setEndDate(null);
      } else if (clickedTime === startTime) {
        // If clicked same date, clear selection
        setStartDate(null);
        setEndDate(null);
      } else {
        // Set as end date
        setEndDate(isoValue);
      }
      return;
    }

    // If both dates are selected, start over
    if (startDate && endDate) {
      setStartDate(isoValue);
      setEndDate(null);
    }
  };

  const isDateInRange = (isoValue: string) => { //checks if a date is in the selected range
    if (!startDate) return false;
    
    const dateTime = new Date(isoValue).getTime();
    const startTime = new Date(startDate).getTime();

    if (!endDate) {
      return dateTime === startTime;
    }

    const endTime = new Date(endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const isStartOrEndDate = (isoValue: string) => { //checks if date is start or end
    return isoValue === startDate || isoValue === endDate;
  };

  const toggleProvinceSelection = (province: string) => { //toggles the selection of a province
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { //handles form submission
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const submissionStartedAt = Date.now(); //timestamp for submission start
    setError(null);
    setIsSubmitting(true);
    setShowMessage(true);

    const parseList = (value: string) =>
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
      .post("/api/generate", preparedPayload)
      .then((response) => {
        const elapsed = Date.now() - submissionStartedAt; //calculates elapsed time
        const remaining = Math.max(0, 5000 - elapsed);

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
        setError("We couldn't reach the travel planner. Please try again.");
      });
  };

  const goToAdjacentMonth = (offset: number) => { //navigates to the previous or next month
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

  return ( //main JSX return
    <div className="min-h-screen w-full bg-white px-4 py-10 text-black sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-wide text-black">
            Travel Planner Assistant
          </h1>
          <p className="text-base italic text-black/80">
            Enter your trip details.
          </p>
        </header>

        <form
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-5 rounded-3xl bg-black p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
              <input
                aria-label="Purpose of trip"
                className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:bg-black/5"
                placeholder="e.g., surfing, cultural, wellness"
                value={formState.purposeInput}
                onChange={(event) => handleFieldChange("purposeInput", event.target.value)}
                disabled={isSubmitting}
              />
              <span className="shrink-0 text-right text-sm italic text-black/75">
                Purpose of trip
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
              <input
                aria-label="Budget in LKR"
                className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:bg-black/5"
                placeholder="Budget (LKR)"
                value={formState.budget}
                inputMode="numeric"
                onChange={(event) => handleFieldChange("budget", event.target.value)}
                disabled={isSubmitting}
              />
              <span className="shrink-0 text-right text-sm italic text-black/75">
                Budget (LKR)
              </span>
            </div>

            <div className="relative">
              <div
                className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
                onClick={() => !isSubmitting && setShowProvinceDropdown(!showProvinceDropdown)}
              >
                <div className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner">
                  {formState.selectedProvinces.length > 0
                    ? formState.selectedProvinces.join(", ")
                    : "Select provinces"}
                </div>
                <span className="shrink-0 text-right text-sm italic text-black/75">
                  Provinces to visit
                </span>
              </div>
              {showProvinceDropdown && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-black/10 bg-white p-4 shadow-lg">
                  <div className="space-y-2">
                    {SRI_LANKA_PROVINCES.map((province) => (
                      <label
                        key={province}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-yellow-50"
                      >
                        <input
                          type="checkbox"
                          checked={formState.selectedProvinces.includes(province)}
                          onChange={() => toggleProvinceSelection(province)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-black/30 text-yellow-400 focus:ring-yellow-400"
                        />
                        <span className="text-sm text-black">{province}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
              <select
                aria-label="Solo or family"
                className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:bg-black/5"
                value={formState.tripType}
                onChange={(event) =>
                  handleFieldChange("tripType", event.target.value as TripFormState["tripType"])
                }
                disabled={isSubmitting}
              >
                <option value="solo">Solo</option>
                <option value="family">Family</option>
              </select>
              <span className="shrink-0 text-right text-sm italic text-black/75">
                Solo or family
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
              <textarea
                aria-label="Additional preferences"
                className="h-24 w-full flex-1 resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:bg-black/5"
                placeholder="Any additional preferences (e.g., vegetarian meals, wheelchair access)"
                value={formState.preferencesInput}
                onChange={(event) => handleFieldChange("preferencesInput", event.target.value)}
                disabled={isSubmitting}
              />
              <span className="shrink-0 text-right text-sm italic text-black/75">
                Additional preferences
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f29331a] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
              <input
                aria-label="Selected travel dates"
                className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-black shadow-inner focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:bg-black/5"
                placeholder="Select dates from the calendar"
                value={formattedSelectedDates}
                readOnly
                disabled={isSubmitting}
              />
              <span className="shrink-0 text-right text-sm italic text-black/75">
                Dates spending
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm italic text-white/80">Gender</span>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formState.gender === "male"}
                      onChange={(event) =>
                        handleFieldChange("gender", event.target.value as TripFormState["gender"])
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4 border-white/60 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-white">Male</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formState.gender === "female"}
                      onChange={(event) =>
                        handleFieldChange("gender", event.target.value as TripFormState["gender"])
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4 border-white/60 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-white">Female</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={formState.gender === "other"}
                      onChange={(event) =>
                        handleFieldChange("gender", event.target.value as TripFormState["gender"])
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4 border-white/60 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-white">Other</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-center text-sm italic text-black/70">
              Please select the start date and the end date
            </p>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Calendar</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToAdjacentMonth(-1)}
                  className="rounded-full border border-black/10 px-3 py-1 text-sm text-black transition hover:border-yellow-400 hover:text-yellow-500"
                  disabled={isSubmitting}
                >
                  Prev
                </button>
                <p className="text-sm font-medium text-black/80">
                  {currentMonthLabel}
                </p>
                <button
                  type="button"
                  onClick={() => goToAdjacentMonth(1)}
                  className="rounded-full border border-black/10 px-3 py-1 text-sm text-black transition hover:border-yellow-400 hover:text-yellow-500"
                  disabled={isSubmitting}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-black/60">
              {WEEKDAY_LABELS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map(({ isoValue, label, isCurrentMonth }) => {
                const inRange = isDateInRange(isoValue);
                const isStartEnd = isStartOrEndDate(isoValue);
                return (
                  <button
                    type="button"
                    key={isoValue}
                    onClick={() => handleDateClick(isoValue)}
                    disabled={!isCurrentMonth || isSubmitting}
                    className={`flex h-12 w-full items-center justify-center rounded-xl border text-sm transition
                      ${
                        !isCurrentMonth
                          ? "cursor-not-allowed border-transparent bg-black/5 text-black/30"
                          : isStartEnd
                            ? "border-yellow-400 bg-[#FFD700] font-semibold text-black shadow-[0_0_12px_rgba(255,215,0,0.45)]"
                            : inRange
                              ? "border-yellow-300 bg-yellow-100 text-black"
                              : "border-black/10 bg-white text-black hover:border-yellow-400 hover:shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-black px-6 py-3 text-base font-semibold uppercase tracking-wide text-[#FFD700] shadow-md transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,215,0,0.45)] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-black/40 disabled:shadow-none"
              disabled={isSubmitting}
            >
              Enter
            </button>
          </div>

          {error && (
            <p className="rounded-xl border border-yellow-400/60 bg-[#FFF9DB] px-4 py-3 text-center text-sm font-medium text-black">
              {error}
            </p>
          )}
        </form>

        <AnimatePresence>  {/* Animates the presence of the message */}
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto w-full max-w-md rounded-2xl border border-black/10 bg-white px-6 py-4 text-center shadow-lg"
            >
              <p className="text-base font-medium text-black">Message: Generating...</p>
            </motion.div>
          )}
        </AnimatePresence> 
      </div>
    </div>
  );
};

export default PromptExtension; //exports the component

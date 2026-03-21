import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RouteOptimizer from "./routeOptimizer";

jest.mock("../../components/global/searchbar", () => () => (
  <div data-testid="search-bar">searchbar</div>
));

jest.mock("../../config/backendUrls", () => ({
  getRouteOptimizerBaseUrl: () => "",
}));

jest.mock("@react-google-maps/api", () => {
  const Wrapper = ({ children }) => <div>{children}</div>;
  return {
    CircleF: Wrapper,
    DirectionsRenderer: Wrapper,
    GoogleMap: Wrapper,
    InfoWindowF: Wrapper,
    MarkerF: Wrapper,
    PolylineF: Wrapper,
    TrafficLayer: Wrapper,
    useJsApiLoader: jest.fn(() => ({ isLoaded: false, loadError: null })),
  };
});

describe("RouteOptimizer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders core route optimizer controls", () => {
    render(<RouteOptimizer />);

    expect(screen.getByRole("heading", { name: "Route Optimizer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Optimize route" })).toBeInTheDocument();
    expect(screen.getByText("No selected places yet. Add destinations above.")).toBeInTheDocument();
  });

  it("adds a destination in manual mode", () => {
    render(<RouteOptimizer />);

    const addButtons = screen.getAllByRole("button", { name: "Add" });
    fireEvent.click(addButtons[0]);

    expect(screen.getByRole("button", { name: "Clear visited" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Visited").length).toBeGreaterThan(0);
    expect(screen.queryByText("No selected places yet. Add destinations above.")).not.toBeInTheDocument();
  });

  it("shows validation error when optimizing with no selected destinations", async () => {
    render(<RouteOptimizer />);

    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(
      await screen.findByText("Add destinations first, then click “Optimize route”.")
    ).toBeInTheDocument();
  });

  it("shows generator source error when no generated itinerary is stored", () => {
    render(<RouteOptimizer />);

    fireEvent.change(screen.getByRole("combobox", { name: "Source" }), {
      target: { value: "generator" },
    });

    expect(
      screen.getByText(
        "No generated itinerary found. Generate one in the Itinerary Generator feature, or switch to Manual."
      )
    ).toBeInTheDocument();
  });
});

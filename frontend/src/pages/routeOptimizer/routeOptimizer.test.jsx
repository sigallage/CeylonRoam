import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RouteOptimizer from "./routeOptimizer";

jest.mock("../../components/global/searchbar", () => () => (
  <div data-testid="search-bar">searchbar</div>
));

jest.mock("../../config/backendUrls", () => ({
  getAuthBaseUrl: () => "",
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

    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: {
            latitude: 7.8731,
            longitude: 80.7718,
            accuracy: 10,
          },
        })
      ),
      watchPosition: jest.fn(() => 1),
      clearWatch: jest.fn(),
    };

    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
    });
  });

  it("renders core route optimizer controls", () => {
    render(<RouteOptimizer />);

    expect(screen.getByText("Route Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manual" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved Itineraries" })).toBeInTheDocument();
    expect(screen.getByText("Available Destinations")).toBeInTheDocument();
    expect(screen.getByText("Current Route")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Optimize" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Start Route" })).toBeDisabled();

    // When geolocation is available, the synthetic start marker is shown in the route list.
    expect(screen.getByText("Your location")).toBeInTheDocument();
  });

  it("adds a destination in manual mode", () => {
    render(<RouteOptimizer />);

    const addButtons = screen.getAllByRole("button", { name: "Add" });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText("Your location")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Optimize" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Start Route" })).not.toBeDisabled();
  });

  it("enables Start Route after adding one destination", () => {
    render(<RouteOptimizer />);

    expect(screen.getByRole("button", { name: "Start Route" })).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);
    expect(screen.getByRole("button", { name: "Start Route" })).not.toBeDisabled();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import CategoryCards from "./CategoryCards";
import { buildCategories } from "./categoryData";

const categories = buildCategories(
  [{ id: 11, label: "CAKE MAKING & BAKING COURSE" }, { id: 9, label: "ELECTRICIAN CERTIFICATE COURSE" }],
  [
    { id: 1, category: 11, name: "Basic Cake", duration: 1, fee: "500" },
    { id: 2, category: 11, name: "Advance Cake", duration: 1, fee: "600" },
  ],
  () => "3 Month"
);

test("renders all 8 client categories, none of them as links", () => {
  render(<CategoryCards categories={categories} onEnroll={() => {}} />);
  expect(screen.getAllByRole("button", { name: /enroll now/i })).toHaveLength(8);
  expect(screen.queryAllByRole("link")).toHaveLength(0);
});

test("Enroll opens the form for exactly that category", () => {
  const onEnroll = jest.fn();
  render(<CategoryCards categories={categories} onEnroll={onEnroll} />);
  fireEvent.click(screen.getAllByRole("button", { name: /enroll now/i })[0]);
  expect(onEnroll).toHaveBeenCalledTimes(1);
  expect(onEnroll).toHaveBeenCalledWith("cake");
});

test("clicking the card body does not enroll or navigate", () => {
  const onEnroll = jest.fn();
  render(<CategoryCards categories={categories} onEnroll={onEnroll} />);
  fireEvent.click(screen.getByText("CAKE MAKING & BAKING COURSE"));
  expect(onEnroll).not.toHaveBeenCalled();
});

test("limit shows only the first 4 (Home) and program counts are plain text", () => {
  render(<CategoryCards categories={categories} limit={4} onEnroll={() => {}} />);
  expect(screen.getAllByRole("button", { name: /enroll now/i })).toHaveLength(4);
  expect(screen.getByText("2 Programs")).toBeInTheDocument();
});

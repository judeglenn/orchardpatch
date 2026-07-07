/**
 * EmptyCell — shared empty-cell element for all "no data" table cells.
 *
 * Renders a deliberately blank element that:
 *   - Shows no glyph, no word (not even an em dash)
 *   - Preserves row height and grid alignment via min-height
 *   - Is hidden from assistive technology (aria-hidden)
 *
 * Use <EmptyCell /> in JSX render positions.
 * Use EMPTY_VALUE in non-JSX contexts (format functions, computed string values).
 *
 * This is the single enforcement point for the "no glyph" copy standard.
 * Do not add em dashes or placeholder text at individual call sites.
 */

export function EmptyCell() {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-block", minHeight: "1em" }}
    />
  );
}

/** For non-JSX contexts: format functions, object values, string props. */
export const EMPTY_VALUE = "";

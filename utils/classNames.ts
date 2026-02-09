/**
 * ClassNames Utility
 * Helper for conditionally joining classnames
 */

export function classNames(
  ...classes: (string | undefined | null | Record<string, boolean>)[]
): string {
  return classes
    .flat()
    .map((cls) => {
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return cls || '';
    })
    .filter(Boolean)
    .join(' ');
}

export default classNames;

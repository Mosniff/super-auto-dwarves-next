// Accepts only a string of optional minus sign and digits, returning the
// integer, and returns null for anything else (missing field, File, empty,
// decimal, exponent, surrounding whitespace). Range checks belong to the
// game rules.
export function parseIntegerFormValue(
  formValue: FormDataEntryValue | null,
): number | null {
  if (typeof formValue !== "string" || !/^-?\d+$/.test(formValue)) {
    return null;
  }

  return Number(formValue);
}

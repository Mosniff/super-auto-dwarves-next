// Reads the Turnstile widget's hidden cf-turnstile-response field. Returns
// undefined rather than null for a missing, empty or file value, because it
// feeds an optional argument and Supabase's optional captchaToken. The token
// is never validated here: Supabase verifies it with Cloudflare.
export function parseCaptchaTokenFormValue(
  formValue: FormDataEntryValue | null,
): string | undefined {
  if (typeof formValue === "string" && formValue.length > 0) {
    return formValue;
  }

  return undefined;
}

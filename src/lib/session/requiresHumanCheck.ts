// Only a visitor with no session will be signed in as a guest, so only they
// need a CAPTCHA token. If the session read fails, showing the widget is
// the safe default: a needless check costs a second, while a missing token
// would block sign-in. This only decides what the home page shows; it
// never signs anyone in.
export async function requiresHumanCheck(
  readCurrentUserId: () => Promise<string | null>,
): Promise<boolean> {
  try {
    return (await readCurrentUserId()) === null;
  } catch {
    return true;
  }
}

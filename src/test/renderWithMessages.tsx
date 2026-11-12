import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import messages from "../../messages/en.json";

// Forwards Testing Library's own render options (notably `wrapper`, for
// mounting the component under test inside something like GameScreen) while
// still always providing the real English messages.
export function renderWithMessages(ui: ReactElement, options?: RenderOptions) {
  const OuterWrapper = options?.wrapper;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="en" messages={messages}>
        {OuterWrapper ? <OuterWrapper>{children}</OuterWrapper> : children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { ...options, wrapper: Wrapper });
}

export * from "@testing-library/react";

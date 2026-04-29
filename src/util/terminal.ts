let inAltScreen = false;

export function enterAltScreen(): void {
  if (inAltScreen) return;
  if (!process.stdout.isTTY) return;
  process.stdout.write("\x1b[?1049h\x1b[H\x1b[2J\x1b[3J");
  process.stdout.write("\x1b[?25l"); // hide cursor; Ink draws its own caret
  inAltScreen = true;
}

export function leaveAltScreen(): void {
  if (!inAltScreen) return;
  process.stdout.write("\x1b[?25h"); // show cursor
  process.stdout.write("\x1b[?1049l");
  inAltScreen = false;
}

export function clearScreen(): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
}

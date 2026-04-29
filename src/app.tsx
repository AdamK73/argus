import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Splash } from "./boot/splash.js";
import { AdminKeyPrompt } from "./boot/admin-key-prompt.js";
import { Menu, type MenuKey } from "./modes/menu.js";
import { Blitzkrieg } from "./modes/blitzkrieg/index.js";
import { StatusBar } from "./ui/status-bar.js";
import { palette } from "./ui/theme.js";

type Stage = "splash" | "auth" | "menu" | "blitzkrieg" | "settings";

export interface AppProps {
  initialEndpoint: string | null;
  defaultStoreCode: string;
}

export function App({ initialEndpoint, defaultStoreCode }: AppProps): React.ReactElement {
  const app = useApp();
  const [stage, setStage] = useState<Stage>("splash");
  const showStatus = stage !== "splash" && stage !== "auth";

  const goto = (next: Stage): void => setStage(next);

  const handleMenu = (k: MenuKey): void => {
    if (k === "quit") app.exit();
    else if (k === "blitzkrieg") goto("blitzkrieg");
    else if (k === "settings") goto("settings");
  };

  return (
    <Box flexDirection="column">
      <StageView
        key={stage}
        stage={stage}
        initialEndpoint={initialEndpoint}
        defaultStoreCode={defaultStoreCode}
        onAuthReady={() => goto("menu")}
        onSplashDone={() => goto("auth")}
        onMenuSelect={handleMenu}
        onBlitzExit={() => goto("menu")}
        onSettingsBack={() => goto("menu")}
      />
      {showStatus ? (
        <Box marginTop={1}>
          <StatusBar />
        </Box>
      ) : null}
    </Box>
  );
}

interface StageViewProps {
  stage: Stage;
  initialEndpoint: string | null;
  defaultStoreCode: string;
  onAuthReady: () => void;
  onSplashDone: () => void;
  onMenuSelect: (k: MenuKey) => void;
  onBlitzExit: () => void;
  onSettingsBack: () => void;
}

function StageView(props: StageViewProps): React.ReactElement {
  switch (props.stage) {
    case "splash":
      return <Splash onDone={props.onSplashDone} />;
    case "auth":
      return (
        <AdminKeyPrompt initialEndpoint={props.initialEndpoint} onReady={props.onAuthReady} />
      );
    case "menu":
      return <Menu onSelect={props.onMenuSelect} />;
    case "blitzkrieg":
      return <Blitzkrieg defaultStore={props.defaultStoreCode} onExit={props.onBlitzExit} />;
    case "settings":
      return <SettingsStub onBack={props.onSettingsBack} />;
  }
}

function SettingsStub({ onBack }: { onBack: () => void }): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape || key.return) onBack();
  });
  return (
    <Box paddingX={2} paddingY={1} flexDirection="column">
      <Text color={palette.fg}>settings · planned</Text>
      <Text color={palette.dim}>esc / ↵ back</Text>
    </Box>
  );
}

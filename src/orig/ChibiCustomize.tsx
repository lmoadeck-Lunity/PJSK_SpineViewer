// import React, {} from "react";

import chibiList from "./chibi_list.json";
import chibiAnimationList from "./chibi_animation_list.json";
import {
  Select,
  Checkbox,
  Button,
  Card,
  Image,
  Text,
  Badge,
  Group,
  useMantineTheme,
  Stack,
  Accordion,
  ThemeIcon,
  Divider,
  Box,
  Title,
  ScrollArea,
  LoadingOverlay,
  Alert,
} from "@mantine/core";
import {
  IconCamera,
  IconVideo,
  IconUser,
  IconSettings,
  IconFileExport,
  IconHelp,
  IconAlertCircle,
} from "@tabler/icons";

function ChibiCustomize({
  canvas,
  loading,
  currentChibi,
  setCurrentChibi,
  currentChibiAnimation,
  setCurrentChibiAnimation,
  showShadowHook,
  setShowShadowHook,
  showDebugHook,
  setShowDebugHook,
  captureStatic,
  captureAnimated,
}) {
  const theme = useMantineTheme();
  return (
    <main>
      <Card shadow="sm" p="lg" style={{ maxWidth: 300, overflow: "visible" }}>
        <Card.Section style={{ position: "relative" }}>
          <Image
            src="./banner.png"
            height={80}
            alt="Project Sekai Chibi Viewer"
            style={{ borderRadius: "4px 4px 0 0", overflow: "hidden" }}
          />
          <img
            class="rui"
            src="./rui.png"
            height={128}
            alt="Project Sekai Chibi Viewer"
          />
        </Card.Section>
        <Card.Section>
          <ScrollArea style={{ height: 320 }} scrollbarSize={6}>
            <Box style={{ padding: theme.spacing.lg }}>
              <Title order={4} style={{ margin: "0 0 0.5em" }}>
                <ThemeIcon
                  color="orange"
                  variant="light"
                  style={{ marginRight: 10 }}
                >
                  <IconUser size={14} />
                </ThemeIcon>
                Character
              </Title>
              <Box>
                <Stack spacing="xs">
                  <Select
                    label="Character"
                    data={chibiList}
                    value={currentChibi}
                    onChange={setCurrentChibi}
                    searchable
                  />
                  <Select
                    label="Animation"
                    data={chibiAnimationList}
                    value={currentChibiAnimation}
                    onChange={setCurrentChibiAnimation}
                    searchable
                  />
                </Stack>
              </Box>
              <Title order={4} style={{ margin: "1em 0" }}>
                <ThemeIcon
                  color="yellow"
                  variant="light"
                  style={{ marginRight: 10 }}
                >
                  <IconSettings size={14} />
                </ThemeIcon>
                Options
              </Title>
              <Box>
                <Stack spacing="xs">
                  <Checkbox
                    label="Show Shadow"
                    checked={showShadowHook}
                    onChange={(event) =>
                      setShowShadowHook(event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Show Debug Outlines"
                    checked={showDebugHook}
                    onChange={(event) =>
                      setShowDebugHook(event.currentTarget.checked)
                    }
                  />
                </Stack>
              </Box>
              <Title order={4} style={{ margin: "1em 0" }}>
                <ThemeIcon
                  color="teal"
                  variant="light"
                  style={{ marginRight: 10 }}
                >
                  <IconFileExport size={14} />
                </ThemeIcon>
                Export
              </Title>
              <Group spacing="xs">
                <Button
                  variant="light"
                  size="xs"
                  style={{ flex: 1 }}
                  leftIcon={<IconCamera size={16} />}
                  onClick={captureStatic}
                >
                  PNG
                </Button>
                <Button
                  variant="light"
                  size="xs"
                  style={{ flex: 1 }}
                  leftIcon={<IconVideo size={16} />}
                  onClick={captureAnimated}
                >
                  GIF
                </Button>
              </Group>{" "}
              <Alert
                icon={<IconAlertCircle size={16} />}
                // title="Notice"
                color="red"
                style={{ marginTop: "10px" }}
              >
                GIF export timing can be a bit buggy right now. Am I ever going
                to fix it? No idea.
              </Alert>
              <Title order={4} style={{ margin: "1em 0 0.5em" }}>
                <ThemeIcon
                  color="blue"
                  variant="light"
                  style={{ marginRight: 10 }}
                >
                  <IconHelp size={14} />
                </ThemeIcon>
                About
              </Title>
              <Text size="sm">
                Project Sekai Chibi Viewer made by{" "}
                <Text
                  size="sm"
                  variant="link"
                  component="a"
                  href="https://github.com/yuuukun/"
                >
                  @yuuukun
                </Text>
                , with code and inspiration from{" "}
                <Text
                  size="sm"
                  variant="link"
                  component="a"
                  href="https://github.com/esterTion/"
                >
                  @esterTion
                </Text>
                {", "}
                <Text
                  size="sm"
                  variant="link"
                  component="a"
                  href="https://pjsek.ai/"
                >
                  pjsek.ai
                </Text>
                {", and "}
                <Text
                  size="sm"
                  variant="link"
                  component="a"
                  href="https://github.com/gradualcolors/"
                >
                  @gradualcolors
                </Text>
                . Special thanks to{" "}
                <Text
                  size="sm"
                  variant="link"
                  component="a"
                  href="https://github.com/watatomo/"
                >
                  @watatomo
                </Text>
                !
              </Text>
            </Box>
          </ScrollArea>
        </Card.Section>
      </Card>

      <Card
        shadow="sm"
        p="lg"
        style={{
          padding: 0,
        }}
        sx={(theme) => ({
          width: 400,
          height: 400,
          marginLeft: theme.spacing.md,

          "@media (max-width: 720px)": {
            width: 300,
            height: 300,
          },
        })}
      >
        <LoadingOverlay visible={!!loading} overlayOpacity={0.8} />
        <canvas ref={canvas} width={275} height={275} />
      </Card>
    </main>
  );
}
export default ChibiCustomize;

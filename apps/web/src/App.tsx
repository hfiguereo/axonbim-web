import { AppChrome } from "./components/AppChrome";
import { DockResizeHandle } from "./components/DockResizeHandle";
import { PanelSplitHandle } from "./components/PanelSplitHandle";
import { ProjectBrowser } from "./components/ProjectBrowser";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Ribbon } from "./components/Ribbon";
import { StatusBar } from "./components/StatusBar";
import { SystemBrowserStub } from "./components/SystemBrowserStub";
import { ViewIconBar } from "./components/ViewIconBar";
import { Viewport } from "./components/Viewport";
import { ViewTabs } from "./components/ViewTabs";
import { useSessionStore } from "./sessionStore";

export function App() {
  const browserDock = useSessionStore((s) => s.browserDock);
  const propertiesDock = useSessionStore((s) => s.propertiesDock);
  const browserVisible = useSessionStore((s) => s.browserVisible);
  const propertiesVisible = useSessionStore((s) => s.propertiesVisible);
  const systemBrowserVisible = useSessionStore((s) => s.systemBrowserVisible);
  const iconBarVisible = useSessionStore((s) => s.iconBarVisible);
  const statusBarVisible = useSessionStore((s) => s.statusBarVisible);
  const dockPreview = useSessionStore((s) => s.dockPreview);
  const draggingPanel = useSessionStore((s) => s.draggingPanel);
  const leftDockWidth = useSessionStore((s) => s.leftDockWidth);
  const rightDockWidth = useSessionStore((s) => s.rightDockWidth);
  const leftDockSplit = useSessionStore((s) => s.leftDockSplit);
  const rightDockSplit = useSessionStore((s) => s.rightDockSplit);

  const propsLeft = propertiesVisible && propertiesDock === "left";
  const browserLeft = browserVisible && browserDock === "left";
  const propsRight = propertiesVisible && propertiesDock === "right";
  const browserRight = browserVisible && browserDock === "right";
  const propsFloat = propertiesVisible && propertiesDock === "float";
  const browserFloat = browserVisible && browserDock === "float";

  const leftHas = propsLeft || browserLeft || systemBrowserVisible;
  const rightHas = propsRight || browserRight;
  const leftBoth = propsLeft && browserLeft;
  const rightBoth = propsRight && browserRight;
  const showDropGuides = draggingPanel !== null;

  return (
    <div className="shell" data-testid="app-shell">
      <AppChrome />
      <Ribbon />
      <div className="shell__workspace">
        {/* Drop guides — both sides while dragging */}
        {showDropGuides && (
          <>
            <div
              className={
                dockPreview === "left"
                  ? "dock-ghost dock-ghost--left dock-ghost--active"
                  : "dock-ghost dock-ghost--left dock-ghost--idle"
              }
              style={{ width: leftDockWidth }}
            />
            <div
              className={
                dockPreview === "right"
                  ? "dock-ghost dock-ghost--right dock-ghost--active"
                  : "dock-ghost dock-ghost--right dock-ghost--idle"
              }
              style={{ width: rightDockWidth }}
            />
          </>
        )}

        {leftHas && (
          <aside
            className="dock-column dock-column--left"
            style={{ width: leftDockWidth, flex: `0 0 ${leftDockWidth}px` }}
          >
            <div className="dock-column__stack">
              {propsLeft && (
                <PropertiesPanel flexGrow={leftBoth ? leftDockSplit : 1} />
              )}
              {leftBoth && <PanelSplitHandle side="left" />}
              {browserLeft && (
                <ProjectBrowser flexGrow={leftBoth ? 1 - leftDockSplit : 1} />
              )}
              {systemBrowserVisible && <SystemBrowserStub />}
            </div>
            <DockResizeHandle side="left" />
          </aside>
        )}

        <main className="shell__stage">
          <ViewTabs />
          <div className="shell__canvas">
            <Viewport />
          </div>
          {iconBarVisible && <ViewIconBar />}
        </main>

        {rightHas && (
          <aside
            className="dock-column dock-column--right"
            style={{ width: rightDockWidth, flex: `0 0 ${rightDockWidth}px` }}
          >
            <DockResizeHandle side="right" />
            <div className="dock-column__stack">
              {propsRight && (
                <PropertiesPanel flexGrow={rightBoth ? rightDockSplit : 1} />
              )}
              {rightBoth && <PanelSplitHandle side="right" />}
              {browserRight && (
                <ProjectBrowser flexGrow={rightBoth ? 1 - rightDockSplit : 1} />
              )}
            </div>
          </aside>
        )}

        {/* Float layer covers full workspace so L/R drop zones match */}
        <div className="shell__float-layer">
          {propsFloat && <PropertiesPanel />}
          {browserFloat && <ProjectBrowser />}
        </div>
      </div>
      {statusBarVisible && <StatusBar />}
    </div>
  );
}

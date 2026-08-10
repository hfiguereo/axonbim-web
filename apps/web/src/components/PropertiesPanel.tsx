import { FloatingPanel } from "./FloatingPanel";
import { PropsNumberInput } from "./PropsNumberInput";
import { useSessionStore } from "../sessionStore";
import { wallMaxHeightOf } from "@axonbim/model";

function ViewportCropBlock() {
  const crop = useSessionStore((s) => {
    void s.documentRev;
    void s.views;
    void s.activeViewId;
    void s.selectedCameraId;
    void s.cropDragLive;
    return s.getActiveViewCrop();
  });
  const setEnabled = useSessionStore((s) => s.setActiveViewCropEnabled);
  const setSize = useSessionStore((s) => s.setActiveViewCropSize);

  const enabled = crop?.enabled ?? false;
  const width = crop ? crop.maxX - crop.minX : 0;
  const depth = crop ? crop.maxY - crop.minY : 0;

  return (
    <div className="props-viewport">
      <h3 className="props-viewport__title">Viewport</h3>
      <label className="type-selector">
        <span>Recortar vista</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
      </label>
      {enabled && (
        <dl className="props">
          <div>
            <dt>Ancho (m)</dt>
            <dd>
              <PropsNumberInput
                min={0.5}
                step={0.1}
                value={Number(width.toFixed(2))}
                onCommit={(v) => setSize(v, depth || 1)}
              />
            </dd>
          </div>
          <div>
            <dt>Fondo (m)</dt>
            <dd>
              <PropsNumberInput
                min={0.5}
                step={0.1}
                value={Number(depth.toFixed(2))}
                onCommit={(v) => setSize(width || 1, v)}
              />
            </dd>
          </div>
        </dl>
      )}
      <p className="props-hint">
        Planta: grips del crop (alcance real). Vista cámara: grips del marco de pantalla
        (no cambian el crop); solo con zoom bloqueado; doble clic = zoom/órbita.
      </p>
    </div>
  );
}

export function PropertiesPanel({ flexGrow = 1 }: { flexGrow?: number }) {
  const doc = useSessionStore((s) => s.document);
  const activeTool = useSessionStore((s) => s.activeTool);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const views = useSessionStore((s) => s.views);
  const graphicScale = useSessionStore((s) => s.graphicScale);
  const visualStyle = useSessionStore((s) => s.visualStyle);
  const dock = useSessionStore((s) => s.propertiesDock);
  const floatPos = useSessionStore((s) => s.propertiesFloat);
  const visible = useSessionStore((s) => s.propertiesVisible);
  const selectedWallId = useSessionStore((s) => s.selectedWallId);
  const selectedDoorId = useSessionStore((s) => s.selectedDoorId);
  const selectedWindowId = useSessionStore((s) => s.selectedWindowId);
  const selectedCameraId = useSessionStore((s) => s.selectedCameraId);
  const activeFamilyId = useSessionStore((s) => s.activeFamilyId);
  const activeDoorFamilyId = useSessionStore((s) => s.activeDoorFamilyId);
  const activeWindowFamilyId = useSessionStore((s) => s.activeWindowFamilyId);
  const wallHeight = useSessionStore((s) => s.wallHeight);
  const setActiveFamilyId = useSessionStore((s) => s.setActiveFamilyId);
  const setActiveDoorFamilyId = useSessionStore((s) => s.setActiveDoorFamilyId);
  const setActiveWindowFamilyId = useSessionStore((s) => s.setActiveWindowFamilyId);
  const setSelectedDoorLeafState = useSessionStore((s) => s.setSelectedDoorLeafState);
  const setSelectedDoorFamily = useSessionStore((s) => s.setSelectedDoorFamily);
  const setSelectedDoorSwing = useSessionStore((s) => s.setSelectedDoorSwing);
  const setSelectedDoorHinge = useSessionStore((s) => s.setSelectedDoorHinge);
  const setSelectedWindowLeafState = useSessionStore((s) => s.setSelectedWindowLeafState);
  const setSelectedWindowFamily = useSessionStore((s) => s.setSelectedWindowFamily);
  const setSelectedWindowSwing = useSessionStore((s) => s.setSelectedWindowSwing);
  const setSelectedWindowHinge = useSessionStore((s) => s.setSelectedWindowHinge);
  const setSelectedCameraName = useSessionStore((s) => s.setSelectedCameraName);
  const setSelectedCameraFov = useSessionStore((s) => s.setSelectedCameraFov);
  const setSelectedCameraEyeHeight = useSessionStore((s) => s.setSelectedCameraEyeHeight);
  const setWallHeight = useSessionStore((s) => s.setWallHeight);
  const setSelectedWallHeight = useSessionStore((s) => s.setSelectedWallHeight);
  const setSelectedWallThickness = useSessionStore((s) => s.setSelectedWallThickness);
  const setSelectedWallFamily = useSessionStore((s) => s.setSelectedWallFamily);
  const view = views.find((v) => v.id === activeViewId);
  const selected = selectedWallId
    ? doc.walls.find((w) => w.id === selectedWallId)
    : undefined;
  const selectedDoor = selectedDoorId
    ? doc.doors.find((d) => d.id === selectedDoorId)
    : undefined;
  const selectedWindow = selectedWindowId
    ? doc.windows.find((w) => w.id === selectedWindowId)
    : undefined;
  const selectedCamera = selectedCameraId
    ? doc.cameras.find((c) => c.id === selectedCameraId)
    : undefined;

  return (
    <FloatingPanel
      panelId="properties"
      title="Propiedades"
      dock={dock}
      floatPos={floatPos}
      visible={visible}
      flexGrow={flexGrow}
      className="float-panel--properties"
    >
      {selectedCamera ? (
        <>
          <dl className="props">
            <div>
              <dt>Nombre</dt>
              <dd>
                <input
                  className="props__input"
                  type="text"
                  value={selectedCamera.name}
                  onChange={(e) => setSelectedCameraName(e.target.value)}
                />
              </dd>
            </div>
            <div>
              <dt>Altura ojo (m)</dt>
              <dd>
                <PropsNumberInput
                  min={0.1}
                  step={0.05}
                  value={selectedCamera.eye.z}
                  onCommit={setSelectedCameraEyeHeight}
                />
              </dd>
            </div>
            <div>
              <dt>FOV (°)</dt>
              <dd>
                <PropsNumberInput
                  min={10}
                  max={120}
                  step={1}
                  value={selectedCamera.fov}
                  onCommit={setSelectedCameraFov}
                />
              </dd>
            </div>
            <div>
              <dt>Ojo XY</dt>
              <dd>
                {selectedCamera.eye.x.toFixed(2)}, {selectedCamera.eye.y.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Mira XY</dt>
              <dd>
                {selectedCamera.target.x.toFixed(2)}, {selectedCamera.target.y.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Id</dt>
              <dd>{selectedCamera.id}</dd>
            </div>
          </dl>
          <ViewportCropBlock />
        </>
      ) : selectedWindow ? (
        <>
          <label className="type-selector">
            <span>Familia</span>
            <select
              value={selectedWindow.familyId}
              onChange={(e) => setSelectedWindowFamily(e.target.value)}
            >
              {doc.windowFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({(f.width * 1000).toFixed(0)}×{(f.height * 1000).toFixed(0)} mm)
                </option>
              ))}
            </select>
          </label>
          <label className="type-selector">
            <span>Hoja</span>
            <select
              value={selectedWindow.leafState ?? "closed"}
              onChange={(e) =>
                setSelectedWindowLeafState(e.target.value as "closed" | "ajar" | "open")
              }
            >
              <option value="open">Abierta (90°)</option>
              <option value="ajar">Entreabierta (45°)</option>
              <option value="closed">Cerrada (0°)</option>
            </select>
          </label>
          <label className="type-selector">
            <span>Sentido</span>
            <select
              value={selectedWindow.swing ?? "positive"}
              onChange={(e) =>
                setSelectedWindowSwing(e.target.value as "positive" | "negative")
              }
            >
              <option value="positive">Normal (+)</option>
              <option value="negative">Invertido (−)</option>
            </select>
          </label>
          <label className="type-selector">
            <span>Bisagra</span>
            <select
              value={selectedWindow.hinge}
              onChange={(e) =>
                setSelectedWindowHinge(e.target.value as "start" | "end")
              }
            >
              <option value="start">Inicio (hacia p1)</option>
              <option value="end">Fin (hacia p2)</option>
            </select>
          </label>
          <p className="props-hint">
            En planta: esfera azul = invertir sentido · verde = cambiar bisagra
          </p>
          <dl className="props">
            <div>
              <dt>Id</dt>
              <dd>{selectedWindow.id}</dd>
            </div>
            <div>
              <dt>Muro</dt>
              <dd>{selectedWindow.wallId}</dd>
            </div>
            <div>
              <dt>Ancho</dt>
              <dd>{selectedWindow.width.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Alto</dt>
              <dd>{selectedWindow.height.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Alféizar</dt>
              <dd>{selectedWindow.sill.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Offset</dt>
              <dd>{selectedWindow.centerOffset.toFixed(2)} m</dd>
            </div>
          </dl>
        </>
      ) : selectedDoor ? (
        <>
          <label className="type-selector">
            <span>Familia</span>
            <select
              value={selectedDoor.familyId}
              onChange={(e) => setSelectedDoorFamily(e.target.value)}
            >
              {doc.doorFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({(f.width * 1000).toFixed(0)}×{(f.height * 1000).toFixed(0)} mm)
                </option>
              ))}
            </select>
          </label>
          <label className="type-selector">
            <span>Hoja</span>
            <select
              value={selectedDoor.leafState ?? "open"}
              onChange={(e) =>
                setSelectedDoorLeafState(e.target.value as "closed" | "ajar" | "open")
              }
            >
              <option value="open">Abierta (90°)</option>
              <option value="ajar">Entreabierta (45°)</option>
              <option value="closed">Cerrada (0°)</option>
            </select>
          </label>
          <label className="type-selector">
            <span>Sentido</span>
            <select
              value={selectedDoor.swing ?? "positive"}
              onChange={(e) =>
                setSelectedDoorSwing(e.target.value as "positive" | "negative")
              }
            >
              <option value="positive">Normal (+)</option>
              <option value="negative">Invertido (−)</option>
            </select>
          </label>
          <label className="type-selector">
            <span>Bisagra</span>
            <select
              value={selectedDoor.hinge}
              onChange={(e) =>
                setSelectedDoorHinge(e.target.value as "start" | "end")
              }
            >
              <option value="start">Inicio (hacia p1)</option>
              <option value="end">Fin (hacia p2)</option>
            </select>
          </label>
          <p className="props-hint">
            En planta: esfera azul = invertir sentido · verde = cambiar bisagra
          </p>
          <dl className="props">
            <div>
              <dt>Id</dt>
              <dd>{selectedDoor.id}</dd>
            </div>
            <div>
              <dt>Muro</dt>
              <dd>{selectedDoor.wallId}</dd>
            </div>
            <div>
              <dt>Ancho</dt>
              <dd>{selectedDoor.width.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Alto</dt>
              <dd>{selectedDoor.height.toFixed(2)} m</dd>
            </div>
            <div>
              <dt>Offset</dt>
              <dd>{selectedDoor.centerOffset.toFixed(2)} m</dd>
            </div>
          </dl>
        </>
      ) : selected ? (
        <>
          <label className="type-selector">
            <span>Familia</span>
            <select
              value={selected.familyId}
              onChange={(e) => setSelectedWallFamily(e.target.value)}
            >
              {doc.families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.thickness * 1000} mm)
                </option>
              ))}
            </select>
          </label>
          <dl className="props">
            <div>
              <dt>Id</dt>
              <dd>{selected.id}</dd>
            </div>
            <div>
              <dt>Altura</dt>
              <dd>
                {selected.vertical.kind === "profile" ? (
                  <span title="Perfil custom — solo lectura (Restablecer vía Sketch)">
                    {wallMaxHeightOf(selected).toFixed(2)} m{" "}
                    <em className="props-hint">(perfil)</em>
                  </span>
                ) : (
                  <PropsNumberInput
                    min={0.05}
                    step={0.1}
                    value={wallMaxHeightOf(selected)}
                    onCommit={setSelectedWallHeight}
                  />
                )}
              </dd>
            </div>
            <div>
              <dt>Espesor</dt>
              <dd>
                <PropsNumberInput
                  min={0.05}
                  step={0.01}
                  value={selected.thickness}
                  onCommit={setSelectedWallThickness}
                />
              </dd>
            </div>
            <div>
              <dt>Longitud</dt>
              <dd>
                {Math.hypot(
                  selected.p2.x - selected.p1.x,
                  selected.p2.y - selected.p1.y,
                ).toFixed(3)}{" "}
                m
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          {activeTool === "window" ? (
            <label className="type-selector">
              <span>Familia ventana</span>
              <select
                value={activeWindowFamilyId}
                onChange={(e) => setActiveWindowFamilyId(e.target.value)}
              >
                {doc.windowFamilies.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({(f.width * 1000).toFixed(0)}×{(f.height * 1000).toFixed(0)} mm)
                  </option>
                ))}
              </select>
            </label>
          ) : activeTool === "door" ? (
            <label className="type-selector">
              <span>Familia puerta</span>
              <select
                value={activeDoorFamilyId}
                onChange={(e) => setActiveDoorFamilyId(e.target.value)}
              >
                {doc.doorFamilies.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({(f.width * 1000).toFixed(0)}×{(f.height * 1000).toFixed(0)} mm)
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="type-selector">
              <span>Type Selector</span>
              <select
                value={activeFamilyId}
                disabled={activeTool !== "wall"}
                onChange={(e) => setActiveFamilyId(e.target.value)}
              >
                {doc.families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.thickness * 1000} mm)
                  </option>
                ))}
              </select>
            </label>
          )}
          {activeTool === "wall" && (
            <dl className="props">
              <div>
                <dt>Altura nueva</dt>
                <dd>
                  <PropsNumberInput
                    min={0.05}
                    step={0.1}
                    value={wallHeight}
                    onCommit={setWallHeight}
                  />
                </dd>
              </div>
            </dl>
          )}
          <dl className="props">
            <div>
              <dt>Proyecto</dt>
              <dd>{doc.meta.name}</dd>
            </div>
            <div>
              <dt>Vista</dt>
              <dd>{view?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Proyección</dt>
              <dd>
                {view?.kind === "plan"
                  ? "Ortogonal"
                  : view?.kind === "camera"
                    ? "Perspectiva (cámara)"
                    : "Perspectiva"}
              </dd>
            </div>
            <div>
              <dt>Escala</dt>
              <dd>{graphicScale}</dd>
            </div>
            <div>
              <dt>Estilo</dt>
              <dd>{visualStyle}</dd>
            </div>
            <div>
              <dt>Muros</dt>
              <dd>{doc.walls.length}</dd>
            </div>
            <div>
              <dt>Puertas</dt>
              <dd>{doc.doors.length}</dd>
            </div>
            <div>
              <dt>Cámaras</dt>
              <dd>{doc.cameras.length}</dd>
            </div>
            <div>
              <dt>Ventanas</dt>
              <dd>{doc.windows.length}</dd>
            </div>
          </dl>
          <ViewportCropBlock />
        </>
      )}
    </FloatingPanel>
  );
}

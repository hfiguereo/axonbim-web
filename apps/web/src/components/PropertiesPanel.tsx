import { BUILTIN_DOOR_FAMILIES, BUILTIN_WALL_FAMILIES } from "@axonbim/families";
import { FloatingPanel } from "./FloatingPanel";
import { useSessionStore } from "../sessionStore";

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
  const activeFamilyId = useSessionStore((s) => s.activeFamilyId);
  const activeDoorFamilyId = useSessionStore((s) => s.activeDoorFamilyId);
  const wallHeight = useSessionStore((s) => s.wallHeight);
  const setActiveFamilyId = useSessionStore((s) => s.setActiveFamilyId);
  const setActiveDoorFamilyId = useSessionStore((s) => s.setActiveDoorFamilyId);
  const setSelectedDoorLeafState = useSessionStore((s) => s.setSelectedDoorLeafState);
  const setSelectedDoorFamily = useSessionStore((s) => s.setSelectedDoorFamily);
  const setSelectedDoorSwing = useSessionStore((s) => s.setSelectedDoorSwing);
  const setSelectedDoorHinge = useSessionStore((s) => s.setSelectedDoorHinge);
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
      {selectedDoor ? (
        <>
          <label className="type-selector">
            <span>Familia</span>
            <select
              value={selectedDoor.familyId}
              onChange={(e) => setSelectedDoorFamily(e.target.value)}
            >
              {BUILTIN_DOOR_FAMILIES.map((f) => (
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
              {BUILTIN_WALL_FAMILIES.map((f) => (
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
                <input
                  className="props__input"
                  type="number"
                  min={0.05}
                  step={0.1}
                  value={selected.height}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setSelectedWallHeight(v);
                  }}
                />
              </dd>
            </div>
            <div>
              <dt>Espesor</dt>
              <dd>
                <input
                  className="props__input"
                  type="number"
                  min={0.05}
                  step={0.01}
                  value={selected.thickness}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setSelectedWallThickness(v);
                  }}
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
          {activeTool === "door" ? (
            <label className="type-selector">
              <span>Familia puerta</span>
              <select
                value={activeDoorFamilyId}
                onChange={(e) => setActiveDoorFamilyId(e.target.value)}
              >
                {BUILTIN_DOOR_FAMILIES.map((f) => (
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
                {BUILTIN_WALL_FAMILIES.map((f) => (
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
                  <input
                    className="props__input"
                    type="number"
                    min={0.05}
                    step={0.1}
                    value={wallHeight}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v > 0) setWallHeight(v);
                    }}
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
              <dd>{view?.kind === "plan" ? "Ortogonal" : "Perspectiva"}</dd>
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
          </dl>
        </>
      )}
    </FloatingPanel>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSessionStore } from "../sessionStore";

export function AppChrome() {
  const fileRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const newProject = useSessionStore((s) => s.newProject);
  const openDemo = useSessionStore((s) => s.openDemo);
  const openFromText = useSessionStore((s) => s.openFromText);
  const exportText = useSessionStore((s) => s.exportText);
  const setStatus = useSessionStore((s) => s.setStatus);
  const projectName = useSessionStore((s) => s.document.meta.name);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // pointerdown in next tick so the opening click does not close it
    const id = window.setTimeout(() => {
      window.document.addEventListener("pointerdown", onDoc);
    }, 0);
    window.document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.document.removeEventListener("pointerdown", onDoc);
      window.document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    openFromText(await file.text(), file.name);
    close();
  };

  const onExport = () => {
    const blob = new Blob([exportText()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${projectName || "proyecto"}.axon`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exportado .axon (v1)");
    close();
  };

  const onSave = () => {
    onExport();
    setStatus("Guardar: por ahora exporta .axon");
  };

  const stub = (label: string) => {
    setStatus(`${label}: maqueta — pendiente`);
    close();
  };

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className="chrome__menu"
        role="menu"
        aria-label="Archivo"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => {
            newProject();
            close();
          }}
        >
          Nuevo
        </button>
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => fileRef.current?.click()}
        >
          Abrir…
        </button>
        <button type="button" role="menuitem" className="chrome__menu-item" onClick={onSave}>
          Guardar
        </button>
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => stub("Guardar como")}
        >
          Guardar como…
        </button>
        <div className="chrome__menu-sep" role="separator" />
        <button type="button" role="menuitem" className="chrome__menu-item" onClick={onExport}>
          Exportar…
        </button>
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => stub("Importar")}
        >
          Importar…
        </button>
        <div className="chrome__menu-sep" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item chrome__menu-item--accent"
          onClick={() => {
            openDemo();
            close();
          }}
        >
          Abrir demo
        </button>
        <div className="chrome__menu-sep" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => stub("Opciones")}
        >
          Opciones…
        </button>
        <button
          type="button"
          role="menuitem"
          className="chrome__menu-item"
          onClick={() => stub("Preferencias")}
        >
          Preferencias…
        </button>
      </div>,
      window.document.body,
    );

  return (
    <div className="chrome">
      <div className="chrome__row">
        <div className="chrome__file">
          <button
            ref={btnRef}
            type="button"
            className={open ? "chrome__brand chrome__brand--open" : "chrome__brand"}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            title="Menú Archivo"
          >
            AxonBIM
            <span className="chrome__brand-caret" aria-hidden>
              ▾
            </span>
          </button>
          {menu}
        </div>

        <div className="qat" aria-label="Quick Access Toolbar">
          <button
            type="button"
            className="qat__btn"
            title="Guardar"
            onClick={onSave}
            aria-label="Guardar"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M3 3h10l2 2v10H3V3zM6 3v4h6V3M6 14v-4h6v4" />
            </svg>
          </button>
          <button type="button" className="qat__btn" disabled title="Deshacer (Etapa 1)">
            ↩
          </button>
          <button type="button" className="qat__btn" disabled title="Rehacer (Etapa 1)">
            ↪
          </button>
        </div>
        <span className="chrome__project">{projectName}</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".axon,.json,application/json"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Mouse libre sobre la escena; un clic opcional captura el cursor para girar
// sin límites. En pantallas táctiles se conserva el gesto de arrastrar.
export function bindFreeLook(canvas, { active, rotate, clear }) {
  let previous = null, touchId = null;
  const reset = () => { previous = null; touchId = null; clear(); };
  const release = () => {
    reset();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  };
  const down = (event) => {
    if (!active()) return;
    if (event.pointerType === "touch") {
      touchId = event.pointerId;
      previous = [event.clientX, event.clientY];
      canvas.setPointerCapture(event.pointerId);
    }
  };
  const lock = () => {
    if (!active() || !window.matchMedia("(pointer: fine)").matches) return;
    canvas.focus({ preventScroll: true });
    try { canvas.requestPointerLock?.()?.catch?.(() => {}); } catch { /* Sigue disponible la mirada libre. */ }
  };
  const move = (event) => {
    if (!active()) { previous = null; return; }
    if (document.pointerLockElement === canvas) {
      if (event.type === "mousemove") rotate(event.movementX, event.movementY);
      return;
    }
    if (event.type !== "pointermove") return;
    if (event.pointerType === "touch" && touchId !== event.pointerId) return;
    if (previous) rotate(event.clientX - previous[0], event.clientY - previous[1]);
    previous = [event.clientX, event.clientY];
  };
  const up = (event) => {
    if (event.pointerType !== "touch") return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    previous = null; touchId = null;
  };
  const leave = () => { previous = null; };
  const context = (event) => event.preventDefault();
  const visibility = () => { if (document.hidden) release(); };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("click", lock);
  canvas.addEventListener("contextmenu", context);
  document.addEventListener("mousemove", move);
  document.addEventListener("pointerlockchange", reset);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("blur", release);
  return {
    release,
    dispose() {
      release();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("click", lock);
      canvas.removeEventListener("contextmenu", context);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("pointerlockchange", reset);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", release);
    },
  };
}

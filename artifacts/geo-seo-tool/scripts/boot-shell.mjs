// Apply before the body is parsed, not after React downloads. No user-agent
// detection: everyone receives the same readable static page and app bundle.
export const bootHead = `<style>
#app-boot-status{display:none}
html.app-booting #root>[data-static-route]{display:none}
html.app-booting #app-boot-status{display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f8fafc;color:#0f766e;font:14px system-ui,sans-serif}
</style><script data-app-boot>
document.documentElement.classList.add('app-booting');
setTimeout(function(){document.documentElement.classList.remove('app-booting')},8000);
</script>`;

export const bootStatus = '<div id="app-boot-status" role="status" aria-live="polite">Loading AEO Improvement…</div>';

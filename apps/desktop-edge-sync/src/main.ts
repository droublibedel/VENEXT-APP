import { invoke } from "@tauri-apps/api/core";

const root = document.getElementById("app");
if (root) {
  void invoke<string>("sync_health").then((msg) => {
    root.textContent = msg;
  });
}

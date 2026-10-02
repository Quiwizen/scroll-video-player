fn main() {
    tauri_build::build();
    // 关键：让构建脚本在 frontend (../src) 变更时重新嵌入前端资源，
    // 否则直接改 src 下的 js/html 再 `tauri build` 不会生效（Tauri v2 默认只监听 tauri.conf.json）。
    println!("cargo:rerun-if-changed=../src");
    println!("cargo:rerun-if-changed=../src/index.html");
    println!("cargo:rerun-if-changed=../src/main.js");
    println!("cargo:rerun-if-changed=../src/styles.css");
}

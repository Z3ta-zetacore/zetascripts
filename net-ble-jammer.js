// net-ble-jammer.js (ZetaOS Tactical Module 5/5)
// ФУНКЦИОНАЛ: Агрессивное подавление Bluetooth Low Energy (BLE) трафика
// Запускается с SD-карты на прошивке BRUCE/BRUTUS

// --- БАЗОВЫЕ УТИЛИТЫ (core-utils.js встроен) ---
var LINE_HEIGHT = 16;
var ZetaUI = {
    log_to_display: function(message, line, color) {
        if (line === 0) fillScreen(0);
        var displayColor = color || 0xFFFF; // White
        drawString(message, 3, line * LINE_HEIGHT, displayColor);
    },
    dialog_choice: function(options) { return dialogChoice(options); },
    show_error: function(message) { dialogError(message); fillScreen(0); ZetaUI.log_to_display("--- ERROR ---", 0, 0xF800); delay(2000); fillScreen(0); }
};
// ----------------------------------------------------


// --- БОЕВАЯ ЛОГИКА: BLE JAMMER ---

var is_jamming_active = false;

/**
 * Запускает/Останавливает BLE Jammer.
 */
function toggle_ble_jammer() {
    if (!is_jamming_active) {
        ZetaUI.log_to_display("BLE JAMMER LAUNCHING...", 0, 0xF800); // Red
        ZetaUI.log_to_display("Target: 2.4 GHz Band (BLE Channels)", 1);
        
        // КРИТИЧЕСКАЯ КОМАНДА: Запуск агрессивного подавления
        // Предполагаем, что BRUCE имеет команду для подавления/заполнения канала
        serialCmd("ble_jammer start"); 
        
        is_jamming_active = true;
        ZetaUI.log_to_display("JAMMER ACTIVE! Press STOP to disengage.", 3, 0xF800);
    } else {
        ZetaUI.log_to_display("BLE JAMMER DISENGAGING...", 0, 0x07E0); // Green
        
        // КРИТИЧЕСКАЯ КОМАНДА: Остановка подавления
        serialCmd("ble_jammer stop"); 
        
        is_jamming_active = false;
        ZetaUI.log_to_display("JAMMER OFFLINE. Proceed to next mission.", 3, 0x07E0);
        delay(2000);
    }
}


// --- ГЛАВНОЕ МЕНЮ JAMMER (Запускается при выборе скрипта) ---
while (true) {
    fillScreen(0);
    
    var status_text = is_jamming_active ? "🟢 JAMMER ACTIVE" : "🔴 JAMMER OFFLINE";
    var button_text = is_jamming_active ? "2. [STOP] Jammer" : "1. [START] Jammer";

    var choice = ZetaUI.dialog_choice({
        [status_text]: "status", // Отображает статус, но не выбирается
        [button_text]: "toggle",
        ["<-- Back / Exit"]: "exit"
    });

    if (choice === "exit" || choice === "") break;
    else if (choice === "toggle") {
        toggle_ble_jammer();
    }
    
    // После запуска или остановки цикла, обновляем экран, чтобы показать новый статус
    fillScreen(0);
}
